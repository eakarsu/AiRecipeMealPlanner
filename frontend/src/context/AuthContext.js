import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout API errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const updateProfile = async (data) => {
    const response = await api.put('/auth/profile', data);
    const updatedUser = response.data.user;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  };

  const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  };

  const resetPassword = async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  };

  const checkPasswordStrength = async (password) => {
    const response = await api.post('/auth/check-password-strength', { password });
    return response.data;
  };

  const verifyEmail = async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  };

  const resendVerification = async () => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, register,
      updateProfile, changePassword, forgotPassword, resetPassword, checkPasswordStrength,
      verifyEmail, resendVerification
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
