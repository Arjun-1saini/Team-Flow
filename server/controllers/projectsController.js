import { Op, fn, col, literal } from 'sequelize';
import { Project, ProjectMember, Task, User } from '../models/index.js';

const USER_ATTRS = ['id', 'name', 'email', 'avatar', 'role'];

// Helper: check if user has access to a project
const getMembership = async (projectId, userId) => {
  const project = await Project.findByPk(projectId, {
    include: [
      { model: User, as: 'owner', attributes: USER_ATTRS },
      { model: User, as: 'members', attributes: USER_ATTRS, through: { attributes: ['role'] } },
    ],
  });
  if (!project) return { error: 'Project not found', status: 404 };
  const isOwner = project.ownerId === userId;
  const membership = project.members.find(m => m.id === userId);
  return { project, isOwner, membership };
};

// GET /api/projects
export const getProjects = async (req, res, next) => {
  try {
    // Projects where user is owner OR member
    const memberOfIds = (
      await ProjectMember.findAll({ where: { userId: req.user.id }, attributes: ['projectId'] })
    ).map(r => r.projectId);

    const projects = await Project.findAll({
      where: {
        [Op.or]: [{ ownerId: req.user.id }, { id: { [Op.in]: memberOfIds } }],
      },
      include: [
        { model: User, as: 'owner', attributes: USER_ATTRS },
        { model: User, as: 'members', attributes: USER_ATTRS, through: { attributes: ['role'] } },
      ],
      order: [['updatedAt', 'DESC']],
    });

    // Attach task count breakdowns
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const tasks = await Task.findAll({
          where: { projectId: p.id },
          attributes: ['status'],
        });
        const taskCounts = { todo: 0, 'in-progress': 0, review: 0, done: 0, total: tasks.length };
        tasks.forEach(t => { taskCounts[t.status] = (taskCounts[t.status] || 0) + 1; });
        return { ...p.toJSON(), taskCounts };
      })
    );

    res.json({ success: true, count: projects.length, projects: projectsWithCounts });
  } catch (e) { next(e); }
};

// GET /api/projects/all  (admin)
export const getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.findAll({
      include: [
        { model: User, as: 'owner', attributes: USER_ATTRS },
        { model: User, as: 'members', attributes: USER_ATTRS, through: { attributes: ['role'] } },
      ],
      order: [['updatedAt', 'DESC']],
    });
    res.json({ success: true, count: projects.length, projects });
  } catch (e) { next(e); }
};

// GET /api/projects/:id
export const getProject = async (req, res, next) => {
  try {
    const { project, isOwner, membership, error, status } = await getMembership(req.params.id, req.user.id);
    if (error) return res.status(status).json({ success: false, message: error });
    if (!isOwner && !membership && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({ success: true, project });
  } catch (e) { next(e); }
};

// POST /api/projects
export const createProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, color, dueDate, tags } = req.body;
    const project = await Project.create({ name, description, status, priority, color, dueDate, tags, ownerId: req.user.id });
    // Add creator as admin member
    await ProjectMember.create({ projectId: project.id, userId: req.user.id, role: 'admin' });

    const full = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: USER_ATTRS },
        { model: User, as: 'members', attributes: USER_ATTRS, through: { attributes: ['role'] } },
      ],
    });
    res.status(201).json({ success: true, project: full });
  } catch (e) { next(e); }
};

// PUT /api/projects/:id
export const updateProject = async (req, res, next) => {
  try {
    const { project, isOwner, membership, error, status } = await getMembership(req.params.id, req.user.id);
    if (error) return res.status(status).json({ success: false, message: error });

    const canEdit = isOwner || membership?.ProjectMember?.role === 'admin' || req.user.role === 'admin';
    if (!canEdit) return res.status(403).json({ success: false, message: 'Access denied' });

    const { name, description, status: st, priority, color, dueDate, tags } = req.body;
    await project.update({ name, description, status: st, priority, color, dueDate, tags });
    await project.reload({
      include: [
        { model: User, as: 'owner', attributes: USER_ATTRS },
        { model: User, as: 'members', attributes: USER_ATTRS, through: { attributes: ['role'] } },
      ],
    });
    res.json({ success: true, project });
  } catch (e) { next(e); }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res, next) => {
  try {
    const { project, isOwner, error, status } = await getMembership(req.params.id, req.user.id);
    if (error) return res.status(status).json({ success: false, message: error });
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Only project owner or admin can delete' });
    await project.destroy(); // cascades to tasks & members
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (e) { next(e); }
};

// POST /api/projects/:id/members
export const addMember = async (req, res, next) => {
  try {
    const { userId, role = 'member' } = req.body;
    const { project, isOwner, membership, error, status } = await getMembership(req.params.id, req.user.id);
    if (error) return res.status(status).json({ success: false, message: error });

    const canManage = isOwner || membership?.ProjectMember?.role === 'admin' || req.user.role === 'admin';
    if (!canManage) return res.status(403).json({ success: false, message: 'Access denied' });

    const existing = await ProjectMember.findOne({ where: { projectId: project.id, userId } });
    if (existing) return res.status(400).json({ success: false, message: 'User is already a member' });

    await ProjectMember.create({ projectId: project.id, userId, role });
    await project.reload({
      include: [
        { model: User, as: 'owner', attributes: USER_ATTRS },
        { model: User, as: 'members', attributes: USER_ATTRS, through: { attributes: ['role'] } },
      ],
    });
    res.json({ success: true, project });
  } catch (e) { next(e); }
};

// DELETE /api/projects/:id/members/:userId
export const removeMember = async (req, res, next) => {
  try {
    const { project, isOwner, error, status } = await getMembership(req.params.id, req.user.id);
    if (error) return res.status(status).json({ success: false, message: error });
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Only owner can remove members' });
    if (project.ownerId === req.params.userId)
      return res.status(400).json({ success: false, message: 'Cannot remove project owner' });

    await ProjectMember.destroy({ where: { projectId: project.id, userId: req.params.userId } });
    res.json({ success: true, message: 'Member removed' });
  } catch (e) { next(e); }
};

// GET /api/projects/:id/stats
export const getProjectStats = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const tasks = await Task.findAll({ where: { projectId: project.id } });
    const now = new Date();

    const statusBreakdown = {};
    const priorityBreakdown = {};
    let overdueTasks = 0;

    tasks.forEach(t => {
      statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
      priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
      if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'done') overdueTasks++;
    });

    const memberCount = await ProjectMember.count({ where: { projectId: project.id } });

    res.json({
      success: true,
      stats: {
        taskStats: Object.entries(statusBreakdown).map(([_id, count]) => ({ _id, count })),
        priorityStats: Object.entries(priorityBreakdown).map(([_id, count]) => ({ _id, count })),
        overdueTasks,
        totalMembers: memberCount,
      },
    });
  } catch (e) { next(e); }
};
