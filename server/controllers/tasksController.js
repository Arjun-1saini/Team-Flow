import { Op } from 'sequelize';
import { Task, Project, ProjectMember, User, Comment } from '../models/index.js';

const USER_ATTRS = ['id', 'name', 'email', 'avatar'];
const PROJECT_ATTRS = ['id', 'name', 'color'];

// Verify user is a member of the project the task belongs to
const checkAccess = async (projectId, userId, userRole) => {
  const project = await Project.findByPk(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  const isOwner = project.ownerId === userId;
  const isMember = await ProjectMember.findOne({ where: { projectId, userId } });
  if (!isOwner && !isMember && userRole !== 'admin')
    return { error: 'Access denied', status: 403 };
  return { project };
};

// GET /api/tasks
export const getTasks = async (req, res, next) => {
  try {
    const { project: projectId, status, priority, assignedTo, search } = req.query;

    // Build project scope
    let projectIds;
    if (projectId) {
      const access = await checkAccess(projectId, req.user.id, req.user.role);
      if (access.error) return res.status(access.status).json({ success: false, message: access.error });
      projectIds = [projectId];
    } else {
      const memberships = await ProjectMember.findAll({ where: { userId: req.user.id }, attributes: ['projectId'] });
      const owned = await Project.findAll({ where: { ownerId: req.user.id }, attributes: ['id'] });
      projectIds = [...new Set([...memberships.map(m => m.projectId), ...owned.map(p => p.id)])];
    }

    const where = { projectId: { [Op.in]: projectIds } };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedToId = assignedTo;
    if (search) where.title = { [Op.iLike]: `%${search}%` };

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'assignedTo', attributes: USER_ATTRS },
        { model: User, as: 'createdBy', attributes: USER_ATTRS },
        { model: Project, as: 'project', attributes: PROJECT_ATTRS },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (e) { next(e); }
};

// GET /api/tasks/:id
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignedTo', attributes: USER_ATTRS },
        { model: User, as: 'createdBy', attributes: USER_ATTRS },
        { model: Project, as: 'project', attributes: [...PROJECT_ATTRS, 'ownerId'] },
        { model: Comment, as: 'comments', include: [{ model: User, as: 'user', attributes: USER_ATTRS }], order: [['createdAt', 'ASC']] },
      ],
    });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const access = await checkAccess(task.projectId, req.user.id, req.user.role);
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    res.json({ success: true, task });
  } catch (e) { next(e); }
};

// POST /api/tasks
export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, project: projectId, assignedTo, dueDate, tags } = req.body;

    const access = await checkAccess(projectId, req.user.id, req.user.role);
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    // Validate assignee is a project member
    if (assignedTo) {
      const isMember = await ProjectMember.findOne({ where: { projectId, userId: assignedTo } });
      const isOwner = access.project.ownerId === assignedTo;
      if (!isMember && !isOwner)
        return res.status(400).json({ success: false, message: 'Assigned user is not a project member' });
    }

    const task = await Task.create({
      title, description, status, priority, dueDate, tags,
      projectId,
      assignedToId: assignedTo || null,
      createdById: req.user.id,
    });

    const full = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignedTo', attributes: USER_ATTRS },
        { model: User, as: 'createdBy', attributes: USER_ATTRS },
        { model: Project, as: 'project', attributes: PROJECT_ATTRS },
      ],
    });

    res.status(201).json({ success: true, task: full });
  } catch (e) { next(e); }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const access = await checkAccess(task.projectId, req.user.id, req.user.role);
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    const { title, description, status, priority, assignedTo, dueDate, tags } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedToId = assignedTo || null;
    if (dueDate !== undefined) updates.dueDate = dueDate || null;
    if (tags !== undefined) updates.tags = tags;

    await task.update(updates);

    const full = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignedTo', attributes: USER_ATTRS },
        { model: User, as: 'createdBy', attributes: USER_ATTRS },
        { model: Project, as: 'project', attributes: PROJECT_ATTRS },
        { model: Comment, as: 'comments', include: [{ model: User, as: 'user', attributes: USER_ATTRS }] },
      ],
    });

    res.json({ success: true, task: full });
  } catch (e) { next(e); }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const project = await Project.findByPk(task.projectId);
    const isCreator = task.createdById === req.user.id;
    const membership = await ProjectMember.findOne({ where: { projectId: task.projectId, userId: req.user.id } });
    const isProjectAdmin = membership?.role === 'admin';
    const isOwner = project?.ownerId === req.user.id;

    if (!isCreator && !isProjectAdmin && !isOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied' });

    await task.destroy();
    res.json({ success: true, message: 'Task deleted' });
  } catch (e) { next(e); }
};

// POST /api/tasks/:id/comments
export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text is required' });

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const access = await checkAccess(task.projectId, req.user.id, req.user.role);
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });

    await Comment.create({ text, taskId: task.id, userId: req.user.id });

    const comments = await Comment.findAll({
      where: { taskId: task.id },
      include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
      order: [['createdAt', 'ASC']],
    });

    res.json({ success: true, comments });
  } catch (e) { next(e); }
};

// GET /api/tasks/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const memberships = await ProjectMember.findAll({ where: { userId: req.user.id }, attributes: ['projectId'] });
    const owned = await Project.findAll({ where: { ownerId: req.user.id }, attributes: ['id'] });
    const projectIds = [...new Set([...memberships.map(m => m.projectId), ...owned.map(p => p.id)])];

    // Return empty stats if user has no projects
    if (projectIds.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalTasks: 0, totalProjects: 0, myTasks: 0,
          overdueTasks: 0, completedThisWeek: 0,
          statusBreakdown: [], priorityBreakdown: [], recentTasks: [],
        },
      });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const allTasks = await Task.findAll({
      where: { projectId: { [Op.in]: projectIds } },
      include: [
        { model: User, as: 'assignedTo', attributes: USER_ATTRS },
        { model: Project, as: 'project', attributes: PROJECT_ATTRS },
      ],
      order: [['updatedAt', 'DESC']],
    });

    const statusBreakdown = {};
    const priorityBreakdown = {};
    let myTasks = 0, overdueTasks = 0, completedThisWeek = 0;

    allTasks.forEach(t => {
      statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
      if (t.status !== 'done') priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
      if (t.assignedToId === req.user.id && t.status !== 'done') myTasks++;
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'done') overdueTasks++;
      if (t.status === 'done' && t.completedAt && new Date(t.completedAt) >= sevenDaysAgo) completedThisWeek++;
    });

    res.json({
      success: true,
      stats: {
        totalTasks: allTasks.length,
        totalProjects: projectIds.length,
        myTasks,
        overdueTasks,
        completedThisWeek,
        statusBreakdown: Object.entries(statusBreakdown).map(([_id, count]) => ({ _id, count })),
        priorityBreakdown: Object.entries(priorityBreakdown).map(([_id, count]) => ({ _id, count })),
        recentTasks: allTasks.slice(0, 5),
      },
    });
  } catch (e) { next(e); }
};
