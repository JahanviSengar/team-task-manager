import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const register = d => api.post('/auth/register', d);
export const login = d => api.post('/auth/login', d);
export const getMe = () => api.get('/auth/me');
export const searchUsers = q => api.get(`/auth/users?search=${q}`);

export const getProjects = () => api.get('/projects');
export const getProject = id => api.get(`/projects/${id}`);
export const createProject = d => api.post('/projects', d);
export const updateProject = (id, d) => api.put(`/projects/${id}`, d);
export const deleteProject = id => api.delete(`/projects/${id}`);
export const addMember = (id, d) => api.post(`/projects/${id}/members`, d);
export const removeMember = (id, uid) => api.delete(`/projects/${id}/members/${uid}`);
export const updateMemberRole = (id, uid, d) => api.put(`/projects/${id}/members/${uid}`, d);

export const getDashboard = () => api.get('/tasks/dashboard');
export const getProjectTasks = (pid, params) => api.get(`/tasks/project/${pid}`, { params });
export const createTask = (pid, d) => api.post(`/tasks/project/${pid}`, d);
export const updateTask = (pid, tid, d) => api.put(`/tasks/project/${pid}/${tid}`, d);
export const deleteTask = (pid, tid) => api.delete(`/tasks/project/${pid}/${tid}`);

export default api;