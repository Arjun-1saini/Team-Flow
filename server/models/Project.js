import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Project = sequelize.define(
  'Project',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { len: [1, 100] },
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    status: {
      type: DataTypes.ENUM('planning', 'active', 'on-hold', 'completed'),
      defaultValue: 'planning',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    color: {
      type: DataTypes.STRING(20),
      defaultValue: '#6366f1',
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
    },
    // ownerId added via association
  },
  {
    tableName: 'projects',
    timestamps: true,
  }
);

export default Project;
