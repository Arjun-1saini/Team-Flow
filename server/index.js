import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
// Import associations so Sequelize registers all relationships before sync
import './models/index.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';

dotenv.config();

const app = express();

// Connect & sync PostgreSQL
connectDB();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow: no origin (curl/Postman), any localhost port in dev, or whitelisted prod URL
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) return callback(null, true);
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TeamFlow API is running (PostgreSQL)' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 TeamFlow Server running on port ${PORT}`);
});
