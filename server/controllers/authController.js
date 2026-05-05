import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    // First registered user becomes admin
    const count = await User.count();
    const assignedRole = count === 0 ? 'admin' : (role === 'admin' ? 'admin' : 'member');

    const user = await User.create({ name, email, password, role: assignedRole });
    const token = generateToken(user.id);
    const { password: _pw, ...userData } = user.toJSON();

    res.status(201).json({ success: true, message: 'Registration successful', token, user: userData });
  } catch (error) { next(error); }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Use scope that includes password
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateToken(user.id);
    const { password: _pw, ...userData } = user.toJSON();

    res.json({ success: true, message: 'Login successful', token, user: userData });
  } catch (error) { next(error); }
};

// GET /api/auth/me
export const getMe = (req, res) => res.json({ success: true, user: req.user });

// PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar } = req.body;
    await req.user.update({ name, bio, avatar });
    res.json({ success: true, user: req.user });
  } catch (error) { next(error); }
};

// PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.scope('withPassword').findByPk(req.user.id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    await user.update({ password: newPassword });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) { next(error); }
};
