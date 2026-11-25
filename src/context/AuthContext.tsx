import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import i18n from '../i18n';
import {
  isApiUnavailableError,
  isMirrorToken,
  saveMirrorProfile,
  syncMirrorUser,
} from '../services/authMirrorService';

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
    try {
      const saved = localStorage.getItem('schemesaathi_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('schemesaathi_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  const persistSession = (newToken: string, newUser: User) => {
    try {
      sessionStorage.removeItem('schemesaathi_explicit_logout');
    } catch {
      // ignore storage errors
    }
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('schemesaathi_token', newToken);
    localStorage.setItem('schemesaathi_user', JSON.stringify(newUser));
    if (newUser.preferredLanguage && ['en', 'kn', 'hi'].includes(newUser.preferredLanguage)) {
      i18n.changeLanguage(newUser.preferredLanguage);
      localStorage.setItem('schemesaathi_lang', newUser.preferredLanguage);
    }
  };

  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setLoading(false);
        return;
      }

      if (isMirrorToken(token)) {
        logout();
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data && typeof res.data === 'object' && res.data.id) {
          setUser(res.data);
          syncMirrorUser(res.data);
          localStorage.setItem('schemesaathi_user', JSON.stringify(res.data));
          if (res.data.preferredLanguage && ['en', 'kn', 'hi'].includes(res.data.preferredLanguage)) {
            i18n.changeLanguage(res.data.preferredLanguage);
            localStorage.setItem('schemesaathi_lang', res.data.preferredLanguage);
          }
        }
      } catch (err: any) {
        const savedRaw = localStorage.getItem('schemesaathi_user');
        const savedUser: User | null = savedRaw ? JSON.parse(savedRaw) : null;

        if (isApiUnavailableError(err) && savedUser) {
          setUser(savedUser);
        } else {
          console.warn('Session expired or invalid token');
          logout();
        }
      } finally {
        setLoading(false);
      }
    }
    verifyAuth();
  }, [token]);

  const formatApiUnavailableMessage = (err: any, fallbackAction: string) => {
    if (err?.response?.data?.message) {
      return String(err.response.data.message);
    }
    if (
      err?.message === 'NON_JSON_HTML_RESPONSE' ||
      (typeof err?.response?.data === 'string' && err.response.data.trim().startsWith('<'))
    ) {
      return `The /api backend route is not responding with JSON. ${fallbackAction}`;
    }
    if (err?.response?.status) {
      return `Server database error (HTTP ${err.response.status}). ${fallbackAction}`;
    }
    return `Unable to reach the server database. ${fallbackAction}`;
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = res.data;
      if (!newToken || !newUser) {
        throw new Error('Invalid login response');
      }
      syncMirrorUser(newUser);
      persistSession(newToken, newUser);
    } catch (err: any) {
      if (isApiUnavailableError(err)) {
        throw new Error(formatApiUnavailableMessage(err, 'Please check your connection and try again.'));
      }
      throw err;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    preferredLanguage = 'en'
  ) => {
    const cleanLang = (['en', 'kn', 'hi'].includes(preferredLanguage)
      ? preferredLanguage
      : 'en') as 'en' | 'kn' | 'hi';

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        preferredLanguage: cleanLang,
      });
      const { token: newToken, user: newUser } = res.data;
      if (!newToken || !newUser) {
        throw new Error('Invalid registration response');
      }
      syncMirrorUser(newUser);
      saveMirrorProfile(newUser.id, { category: [], occupation: '', state: 'Karnataka' });
      persistSession(newToken, newUser);
    } catch (err: any) {
      if (isApiUnavailableError(err)) {
        throw new Error(
          formatApiUnavailableMessage(err, 'Your account was not saved—please try again.')
        );
      }
      throw err;
    }
  };

  const logout = () => {
    try {
      sessionStorage.setItem('schemesaathi_explicit_logout', '1');
    } catch {
      // ignore storage errors
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('schemesaathi_token');
    localStorage.removeItem('schemesaathi_user');
  };

  const setLanguage = async (lang: 'en' | 'kn' | 'hi') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('schemesaathi_lang', lang);
    if (user) {
      const updatedUser = { ...user, preferredLanguage: lang };
      setUser(updatedUser);
      localStorage.setItem('schemesaathi_user', JSON.stringify(updatedUser));
      saveMirrorProfile(user.id, { preferredLanguage: lang });
      if (!isMirrorToken(token)) {
        try {
          await api.put('/profile', { preferredLanguage: lang });
        } catch {
          // non-blocking
        }
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
