import api from './api';

export const login = async (email, password) => {
  // Backend expects JSON format with email/password fields
  const loginData = {
    email: email,
    password: password
  };

  const response = await api.post('/auth/login', loginData, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // DEBUG: Log the full response to see what fields are available
  console.log('🔍 FULL LOGIN RESPONSE:', response.data);
  console.log('🔍 AVAILABLE FIELDS:', Object.keys(response.data));

  // Your backend returns 'access_token' field
  const token = response.data.access_token;

  if (token) {
    localStorage.setItem('access_token', token);
    console.log('✅ Access token stored successfully:', token.substring(0, 20) + '...');
  } else {
    console.error('❌ No token found in login response. Available fields:', Object.keys(response.data));
    console.error('❌ Full response data:', response.data);
  }

  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  console.log('🔓 Access token removed from localStorage');
};