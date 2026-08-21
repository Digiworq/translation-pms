import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Only restore from localStorage — no hardcoded fallback
    const saved = localStorage.getItem('user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;  // null = not logged in, will redirect to /login
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        // Backend unreachable — keep whatever is in localStorage (already set above)
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    try {
      const res = await api.post('/auth/login', { email: cleanEmail, password });
      if (res.data?.success && res.data.user) {
        const userData  = res.data.user;
        const userToken = res.data.token;
        setUser(userData);
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, message: res.data?.message || 'Login failed.' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    // Clear state and storage first
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Fire-and-forget the backend logout
    try { await api.post('/auth/logout'); } catch (e) {}
    // Navigate to login using full page reload so all state is cleared
    window.location.replace('/login');
  };

  const hasRole = (roles) => {
    if (!user) return true;
    if (user.role === 'SUPER_ADMIN') return true;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
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
