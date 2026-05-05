import express from 'express';
import {
  getTasks, getTask, createTask, updateTask, deleteTask,
  addComment, getDashboardStats,
} from '../controllers/tasksController.js';
import { protect } from '../middleware/auth.js';
import { validateTask } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', validateTask, createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addComment);

export default router;
