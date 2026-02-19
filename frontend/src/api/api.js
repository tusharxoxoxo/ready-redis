import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username, password) => {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  return api.post('/api/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (params) => api.get('/api/notifications', { params });
export const getNotification = (id) => api.get(`/api/notifications/${id}`);
export const createNotification = (data) => api.post('/api/notifications', data);
export const retryNotification = (id) => api.post(`/api/notifications/${id}/retry`);
export const deleteNotification = (id) => api.delete(`/api/notifications/${id}`);

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getStats = () => api.get('/api/stats');
