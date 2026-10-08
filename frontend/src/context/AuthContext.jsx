import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('crimemap_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('crimemap_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('crimemap_token');
      if (storedToken) {
        try {
          const resp = await authAPI.getMe();
          setUser(resp.data);
          localStorage.setItem('crimemap_user', JSON.stringify(resp.data));
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const resp = await authAPI.login({ username, password });
    const { access_token, user: userData } = resp.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('crimemap_token', access_token);
    localStorage.setItem('crimemap_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const resp = await authAPI.register(userData);
    return resp.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('crimemap_token');
    localStorage.removeItem('crimemap_user');
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        hasRole,
        isAdmin: user?.role === 'admin',
        isOfficer: user?.role === 'police_officer',
        isAnalyst: user?.role === 'analyst',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
