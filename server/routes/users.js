import express from 'express';
import { getAllUsers, getUserById, updateUserRole, toggleUserStatus, searchUsers } from '../controllers/usersController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/', adminOnly, getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/role', adminOnly, updateUserRole);
router.put('/:id/toggle-status', adminOnly, toggleUserStatus);

export default router;
