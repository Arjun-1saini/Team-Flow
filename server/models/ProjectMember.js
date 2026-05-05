import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Junction table: many users <-> many projects with a role
const ProjectMember = sequelize.define(
  'ProjectMember',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      defaultValue: 'member',
    },
    // projectId and userId are added automatically via associations
  },
  {
    tableName: 'project_members',
    timestamps: true,
    updatedAt: false,
  }
);

export default ProjectMember;
