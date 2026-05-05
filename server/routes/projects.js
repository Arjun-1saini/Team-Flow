import express from 'express';
import {
  getProjects, getAllProjects, getProject, createProject, updateProject,
  deleteProject, addMember, removeMember, getProjectStats,
} from '../controllers/projectsController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validateProject } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getProjects);
router.get('/all', adminOnly, getAllProjects);
router.get('/:id', getProject);
router.post('/', validateProject, createProject);
router.put('/:id', validateProject, updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/stats', getProjectStats);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
