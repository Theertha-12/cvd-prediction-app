import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000', // your FastAPI base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach Authorization header to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;

