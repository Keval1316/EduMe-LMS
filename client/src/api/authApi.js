import api from './axios';

export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  
  login: (credentials) => api.post('/auth/login', credentials),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateInterests: (interests) => api.put('/auth/interests', { interests }),
  
  updateProfile: (payload) => api.put('/auth/profile', payload),
  
  changePassword: (payload) => api.put('/auth/change-password', payload)
};