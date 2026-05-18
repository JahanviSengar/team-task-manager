import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getUsers: (search) => api.get('/auth/users', { params: { search } }),
};

export const projectAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  updateMemberRole: (id, userId, data) => api.put(`/projects/${id}/members/${userId}`, data),
};

export const taskAPI = {
  getAll: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  getOne: (projectId, id) => api.get(`/tasks/project/${projectId}/${id}`),
  create: (projectId, data) => api.post(`/tasks/project/${projectId}`, data),
  update: (projectId, id, data) => api.put(`/tasks/project/${projectId}/${id}`, data),
  delete: (projectId, id) => api.delete(`/tasks/project/${projectId}/${id}`),
  getDashboard: () => api.get('/tasks/dashboard'),
};

export default api;