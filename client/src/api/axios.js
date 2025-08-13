import axios from 'axios';
import toast from 'react-hot-toast';

// Prefer Vite env, fallback to global, then '/api'
const BASE_URL = import.meta?.env?.VITE_API_URL || window.__API_URL__ || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong';
    const reqUrl = error.config?.url || '';
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const onAuthPage = path.includes('/login') || path.includes('/register') || path.includes('/verify-email');

    if (status === 401) {
      // Special-case: profile probe during app boot should not cause storage clear or redirect
      if (reqUrl.includes('/auth/profile') || onAuthPage) {
        return Promise.reject(error);
      }
      // Handle general unauthorized access
      try {
        const current = window.location.pathname + window.location.search + window.location.hash;
        if (!current.includes('/login') && !current.includes('/register')) {
          localStorage.setItem('postLoginRedirect', current);
        }
      } catch (_) {}
      window.location.href = '/login';
      return Promise.reject(error);
    }

    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;