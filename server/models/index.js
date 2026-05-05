import User from './User.js';
import Project from './Project.js';
import ProjectMember from './ProjectMember.js';
import Task from './Task.js';
import Comment from './Comment.js';

// ── Project ownership ─────────────────────────────────────────
// projects.ownerId → users.id
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// ── Project membership (many-to-many through ProjectMember) ───
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'userId', as: 'projects' });
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'projectId', as: 'members' });

// Direct hasMany so we can query the junction easily
Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'memberships' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });
User.hasMany(ProjectMember, { foreignKey: 'userId', as: 'memberships' });
ProjectMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Tasks ─────────────────────────────────────────────────────
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(Task, { foreignKey: 'assignedToId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });

User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// ── Comments ─────────────────────────────────────────────────
Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Task, { foreignKey: 'taskId' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, Project, ProjectMember, Task, Comment };
