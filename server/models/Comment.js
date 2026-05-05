import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Separate SQL table for task comments (was embedded in Task doc before)
const Comment = sequelize.define(
  'Comment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    text: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: { len: [1, 500] },
    },
    // taskId and userId via associations
  },
  {
    tableName: 'comments',
    timestamps: true,
    updatedAt: false,
  }
);

export default Comment;
