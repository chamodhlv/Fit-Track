import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
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

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Users API (Admin)
export const usersAPI = {
  getUsers: (page = 1, limit = 10) => api.get(`/users?page=${page}&limit=${limit}`),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateMe: (userData) => api.put('/users/me', userData),
};

// Workouts API
export const workoutsAPI = {
  getWorkouts: (page = 1, limit = 10) => api.get(`/workouts?page=${page}&limit=${limit}`),
  getWorkout: (id) => api.get(`/workouts/${id}`),
  createWorkout: (workoutData) => api.post('/workouts', workoutData),
  updateWorkout: (id, workoutData) => api.put(`/workouts/${id}`, workoutData),
  deleteWorkout: (id) => api.delete(`/workouts/${id}`),
  getWorkoutStats: () => api.get('/workouts/stats/summary'),
  markCompleted: (id, completedAt) => api.patch(`/workouts/${id}/complete`, completedAt ? { completedAt } : {}),
  uncomplete: (id, completedAt) => api.patch(`/workouts/${id}/uncomplete`, { completedAt }),
  getHistoryCalendar: (year, month) => api.get(`/workouts/history/calendar?year=${year}&month=${month}`),
  getHistoryByDate: (date) => api.get(`/workouts/history/by-date?date=${encodeURIComponent(date)}`),
};

// Blogs API
export const blogsAPI = {
  // public read
  list: (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.category) params.append('category', filters.category);
    return api.get(`/blogs?${params.toString()}`);
  },
  getBySlug: (slug) => api.get(`/blogs/${slug}`),
  // admin
  adminList: (page = 1, limit = 10) => api.get(`/blogs/admin?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/blogs/admin/${id}`),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  remove: (id) => api.delete(`/blogs/${id}`),
};

// Comments API
export const commentsAPI = {
  getComments: (blogId, page = 1, limit = 20) => api.get(`/comments/blog/${blogId}?page=${page}&limit=${limit}`),
  createComment: (data) => api.post('/comments', data),
  updateComment: (id, data) => api.put(`/comments/${id}`, data),
  deleteComment: (id) => api.delete(`/comments/${id}`),
};

// Recipes API
export const recipesAPI = {
  // public read
  list: (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    return api.get(`/recipes?${params.toString()}`);
  },
  getBySlug: (slug) => api.get(`/recipes/${slug}`),
  getFavorites: (page = 1, limit = 10) => api.get(`/recipes/favorites?page=${page}&limit=${limit}`),
  toggleFavorite: (id) => api.post(`/recipes/favorites/${id}`),
  // admin
  adminList: (page = 1, limit = 10) => api.get(`/recipes/admin?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/recipes/admin/${id}`),
  create: (data) => api.post('/recipes', data),
  update: (id, data) => api.put(`/recipes/${id}`, data),
  remove: (id) => api.delete(`/recipes/${id}`),
};

export default api;
