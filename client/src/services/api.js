import axios from 'axios';

const resolveApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location.origin) {
    if (!window.location.origin.includes('localhost:5173') && !window.location.origin.includes('localhost:5174')) {
      return `${window.location.origin}/api`;
    }
  }
  return 'http://localhost:4000/api';
};

const getFormattedApiUrl = (url) => {
  const clean = url.replace(/\/$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const api = axios.create({
  baseURL: getFormattedApiUrl(resolveApiUrl()),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to attach JWT token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginUrl = error.config?.url?.includes('/auth/login');
    if (error.response && error.response.status === 401 && !isLoginUrl) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
