import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Bearer JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('creatoriq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor for 401 handling
client.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('creatoriq_token');
      localStorage.removeItem('creatoriq_user');
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default client;
