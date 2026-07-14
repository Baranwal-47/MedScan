import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/apiBase';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  gender?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ needsVerification: boolean; message: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, phone: string, gender: string) => Promise<void>; // Simplified
  updateAvatar: (file: File) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const API_BASE = API_BASE_URL;

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsAuthReady(true);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch profile');
      logout();
    } finally {
      setIsAuthReady(true);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) {
        const error = await res.json();
        const err: any = new Error(error.message);
        err.needsVerification = !!error.needsVerification;
        throw err;
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('token', data.token);
    } finally {
      setLoading(false);
    }
  };

  // Registration no longer returns a token — the account must be activated
  // via the emailed code first (verifyEmail below).
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data as { needsVerification: boolean; message: string };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setToken(data.token);
      localStorage.setItem('token', data.token);
      await fetchProfile();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  const updateProfile = async (name: string, phone: string, gender: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name, phone, gender })
      });
      
      if (!res.ok) throw new Error('Update failed');
      
      const updatedUser = await res.json();
      setUser(updatedUser);
    } finally {
      setLoading(false);
    }
  };

  const updateAvatar = async (file: File) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch(`${API_BASE}/auth/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Avatar upload failed');
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/reset/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, register, verifyEmail, logout, updateProfile, updateAvatar,
      forgotPassword, resetPassword, loading, isAuthenticated, isAuthReady
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
