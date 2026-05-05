import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Task = sequelize.define(
  'Task',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { len: [1, 200] },
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    status: {
      type: DataTypes.ENUM('todo', 'in-progress', 'review', 'done'),
      defaultValue: 'todo',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // projectId, assignedToId, createdById via associations
  },
  {
    tableName: 'tasks',
    timestamps: true,
    hooks: {
      beforeUpdate: (task) => {
        if (task.changed('status')) {
          if (task.status === 'done' && !task.completedAt) {
            task.completedAt = new Date();
          } else if (task.status !== 'done') {
            task.completedAt = null;
          }
        }
      },
    },
  }
);

export default Task;
