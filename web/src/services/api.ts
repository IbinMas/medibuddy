import axios from 'axios';

// Base API instance configured for /api prefix (proxied in Vite config)
export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || '/api',

  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
