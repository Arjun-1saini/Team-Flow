import axios from 'axios';

// In production (Railway): VITE_API_URL = https://your-backend.railway.app/api
// In development: Vite proxy forwards /api → localhost:5001
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('teamflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('teamflow_token');
      localStorage.removeItem('teamflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
