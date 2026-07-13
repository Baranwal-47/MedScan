import axios from 'axios';

// Single source of truth for the backend URL. Set VITE_API_URL in
// PrescriptionManagement/.env (loaded via envDir in vite.config.ts).
const root = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/+$/, '');
export const API_BASE_URL = root.endsWith('/api') ? root : `${root}/api`;

// Shared axios instance with the JWT attached to every request.
export const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
