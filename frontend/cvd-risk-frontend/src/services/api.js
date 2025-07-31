import axios from 'axios';

// Use environment variable with fallback
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

console.log('🔧 API Configuration:');
console.log('- API_BASE_URL:', API_BASE_URL);
console.log('- Full dashboard URL will be:', `${API_BASE_URL}/dashboard/patient`);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const fullUrl = `${config.baseURL}${config.url}`;
  console.log('🚀 Making request to:', fullUrl);
  console.log('🚀 Request config:', {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    headers: config.headers
  });

  // Try both token keys for compatibility
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Token added to request (first 20 chars):', token.substring(0, 20) + '...');
  } else {
    console.log('⚠️ No access token found in localStorage');
  }
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('✅ API Success:', response.config.url, 'Status:', response.status);
    return response;
  },
  error => {
    console.error('❌ API Error Details:', {
      url: error.config?.url,
      fullUrl: `${error.config?.baseURL}${error.config?.url}`,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      requestHeaders: error.config?.headers,
      message: error.message
    });

    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - redirecting to login');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      window.location = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;