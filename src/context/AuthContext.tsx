import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import i18n from '../i18n';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  preferredLanguage: 'en' | 'kn' | 'hi';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, preferredLanguage?: string) => Promise<void>;
  logout: () => void;
  setLanguage: (lang: 'en' | 'kn' | 'hi') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('schemesaathi_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('schemesaathi_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        localStorage.setItem('schemesaathi_user', JSON.stringify(res.data));
        if (res.data.preferredLanguage && ['en', 'kn', 'hi'].includes(res.data.preferredLanguage)) {
          i18n.changeLanguage(res.data.preferredLanguage);
          localStorage.setItem('schemesaathi_lang', res.data.preferredLanguage);
        }
      } catch (err) {
        console.warn('Session expired or invalid token');
        logout();
      } finally {
        setLoading(false);
      }
    }
    verifyAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('schemesaathi_token', newToken);
    localStorage.setItem('schemesaathi_user', JSON.stringify(newUser));

    if (newUser.preferredLanguage) {
      i18n.changeLanguage(newUser.preferredLanguage);
      localStorage.setItem('schemesaathi_lang', newUser.preferredLanguage);
    }
  };

  const register = async (name: string, email: string, password: string, preferredLanguage = 'en') => {
    const res = await api.post('/auth/register', { name, email, password, preferredLanguage });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('schemesaathi_token', newToken);
    localStorage.setItem('schemesaathi_user', JSON.stringify(newUser));

    i18n.changeLanguage(preferredLanguage);
    localStorage.setItem('schemesaathi_lang', preferredLanguage);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('schemesaathi_token');
    localStorage.removeItem('schemesaathi_user');
  };

  const setLanguage = async (lang: 'en' | 'kn' | 'hi') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('schemesaathi_lang', lang);
    if (user) {
      setUser((prev) => (prev ? { ...prev, preferredLanguage: lang } : null));
      try {
        await api.put('/profile', { preferredLanguage: lang });
      } catch (err) {
        // non-blocking
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setLanguage }}>
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
