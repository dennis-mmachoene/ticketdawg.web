import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStoredAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Refresh from the server so role changes and ended sessions apply on reload
        try {
          const resp = await api.getProfile();
          if (resp?.data?.user) {
            setUser(resp.data.user);
            localStorage.setItem('user', JSON.stringify(resp.data.user));
          }
        } catch (e) {
          // a 401 is handled by the interceptor (clears session)
        }
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const response = await api.login(username, password);
      if (response.success) {
        const { token: newToken, user: newUser } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        navigate('/dashboard');
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: error.message || 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try { await api.logout(); } catch (e) { /* clear locally anyway */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const resp = await api.changePassword(currentPassword, newPassword);
      return { success: !!resp?.success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const isAdmin = user?.role === 'admin';
  const canIssue = isAdmin || (user?.permissions || []).includes('issue');
  const canScan = isAdmin || (user?.permissions || []).includes('scan');

  const value = { user, token, isLoading, login, logout, changePassword, isAdmin, canIssue, canScan };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
