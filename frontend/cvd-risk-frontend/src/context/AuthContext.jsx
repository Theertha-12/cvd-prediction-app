import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from './AppContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout: appLogout, clearAllUserData } = useAppContext();

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        const userData = res.data;
        
        // CRITICAL FIX: Check if this is a different user
        const currentUserId = localStorage.getItem('current_user_id');
        if (currentUserId && currentUserId !== userData.id?.toString()) {
          console.log('🔄 Different user detected, clearing previous user data...');
          clearAllUserData(); // Clear all cached data from previous user
        }
        
        // Store current user ID for future comparison
        localStorage.setItem('current_user_id', userData.id?.toString() || '');
        
        setUser(userData);
      } catch (err) {
        console.error('❌ Failed to fetch user:', err);
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user_id');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, clearAllUserData]);

  const login = async (email, password) => {
    try {
      console.log('🔍 LOGIN DEBUG - Input:', { email, password: '***' });
      
      const loginData = {
        email: email,
        password: password
      };
      
      console.log('🔍 LOGIN DEBUG - Sending JSON:', { 
        email: loginData.email, 
        password: '***' 
      });

      const res = await api.post('/auth/login', loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ LOGIN SUCCESS:', res.data);

      const accessToken = res.data.access_token;
      
      if (!accessToken) {
        throw new Error('No access_token in response');
      }

      // CRITICAL FIX: Clear any existing user data before setting new token
      const existingUserId = localStorage.getItem('current_user_id');
      if (existingUserId) {
        console.log('🗑️ Clearing data from previous login session...');
        clearAllUserData();
      }

      localStorage.setItem('access_token', accessToken);
      setToken(accessToken);

      const userRes = await api.get('/auth/me');
      const userData = userRes.data;
      
      // Store the new user ID
      localStorage.setItem('current_user_id', userData.id?.toString() || '');
      setUser(userData);
      
      return userData;
      
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      console.error('❌ LOGIN ERROR - Response:', error.response?.data);
      console.error('❌ LOGIN ERROR - Status:', error.response?.status);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 REGISTER DEBUG - Registering new user...');
      
      // CRITICAL FIX: Clear any existing user data before registration
      const existingUserId = localStorage.getItem('current_user_id');
      if (existingUserId) {
        console.log('🗑️ Clearing data from previous user before registration...');
        clearAllUserData();
      }
      
      const res = await api.post('/auth/register', userData);
      console.log('✅ REGISTRATION SUCCESS:', res.data);
      
      return res.data;
    } catch (error) {
      console.error('❌ REGISTRATION ERROR:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out and clearing all user data...');
    
    // Call app logout to clear session data
    appLogout();
    
    // Clear auth-specific data
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user_id');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

