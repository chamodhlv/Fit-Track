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
  deleteMe: () => api.delete('/users/me'),
};

// Workouts API
export const workoutsAPI = {
  getWorkouts: (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    return api.get(`/workouts?${params.toString()}`);
  },
  getWorkout: (id) => api.get(`/workouts/${id}`),
  createWorkout: (workoutData) => api.post('/workouts', workoutData),
  updateWorkout: (id, workoutData) => api.put(`/workouts/${id}`, workoutData),
  deleteWorkout: (id) => api.delete(`/workouts/${id}`),
  getWorkoutStats: () => api.get('/workouts/stats/summary'),
  markCompleted: (id, completedAt) => api.patch(`/workouts/${id}/complete`, completedAt ? { completedAt } : {}),
  uncomplete: (id, completedAt) => api.patch(`/workouts/${id}/uncomplete`, { completedAt }),
  getHistoryCalendar: (year, month) => api.get(`/workouts/history/calendar?year=${year}&month=${month}`),
  getHistoryByDate: (date) => api.get(`/workouts/history/by-date?date=${encodeURIComponent(date)}`),
  downloadHistoryPdf: (year, month) => api.get(`/workouts/history/pdf?year=${year}&month=${month}`, { responseType: 'blob' }),
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
    if (filters.search) params.append('search', filters.search);
    return api.get(`/blogs?${params.toString()}`);
  },
  getBySlug: (slug) => api.get(`/blogs/${slug}`),
  downloadPdf: (slug) => api.get(`/blogs/${slug}/pdf`, { responseType: 'blob' }),
  // trainer
  getMyPosts: (page = 1, limit = 10, status = null) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    return api.get(`/blogs/my-posts?${params.toString()}`);
  },
  // admin
  adminList: (page = 1, limit = 10) => api.get(`/blogs/admin?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/blogs/admin/${id}`),
  // owner/admin access for single post
  getMineById: (id) => api.get(`/blogs/mine/${id}`),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  remove: (id) => api.delete(`/blogs/${id}`),
  publish: (id) => api.put(`/blogs/${id}/publish`),
  unpublish: (id) => api.put(`/blogs/${id}/unpublish`),
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
  downloadPdf: (slug) => api.get(`/recipes/${slug}/pdf`, { responseType: 'blob' }),
  // trainer
  getMyRecipes: (page = 1, limit = 10, status = null) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    return api.get(`/recipes/my-recipes?${params.toString()}`);
  },
  // admin
  adminList: (page = 1, limit = 10) => api.get(`/recipes/admin?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/recipes/admin/${id}`),
  // owner/admin access for single recipe
  getMineById: (id) => api.get(`/recipes/mine/${id}`),
  create: (data) => api.post('/recipes', data),
  update: (id, data) => api.put(`/recipes/${id}`, data),
  remove: (id) => api.delete(`/recipes/${id}`),
  publish: (id) => api.put(`/recipes/${id}/publish`),
  unpublish: (id) => api.put(`/recipes/${id}/unpublish`),
};

// Public Trainers API for Booking
export const publicTrainersAPI = {
  list: (page = 1, limit = 10, config = {}, filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (filters.specialty) params.append('specialty', filters.specialty);
    return api.get(`/users/public-trainers?${params.toString()}`, config);
  },
  getById: (id, config = {}) => api.get(`/users/public-trainers/${id}`, config),
};

// Bookings API
export const bookingsAPI = {
  create: (trainerId, date, config = {}) => api.post('/bookings', { trainerId, date }, config),
  myBookings: (page = 1, limit = 10, config = {}) => api.get(`/bookings/my?page=${page}&limit=${limit}`, config),
  receiptPdfUrl: (id) => `${API_BASE_URL}/bookings/${id}/receipt`,
  // Trainer
  myClientsCalendar: (year, month, config = {}) => api.get(`/bookings/my-clients/calendar?year=${year}&month=${month}`, config),
  myClientsByDate: (date, config = {}) => api.get(`/bookings/my-clients/by-date?date=${encodeURIComponent(date)}` , config),
};

// Events API
export const eventsAPI = {
  // public
  list: (page = 1, limit = 10) => api.get(`/events?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/events/${id}`),
  toggleAttendance: (id) => api.post(`/events/${id}/attendance`),
  // admin
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  remove: (id) => api.delete(`/events/${id}`),
  downloadReport: (id) => api.get(`/events/${id}/report`, { responseType: 'blob' }),
};

export default api;
