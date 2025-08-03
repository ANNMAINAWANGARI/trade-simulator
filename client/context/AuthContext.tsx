'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, AuthResponse } from '@/lib/api';

interface User {
  id: string;
  email: string;
  wallet_id: string;
  wallet_stats?: {
    total_chains: number;
    total_tokens: number;
    has_wallet: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loadingAuth: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile(savedToken);
    } else {
      setLoadingAuth(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await api.getProfile(authToken);
      if (response.success && response.data) {
        setUser(response.data.user);
        setToken(authToken);
        console.log(response.data)
      } else {
        localStorage.removeItem('auth_token');
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
    }
    setLoadingAuth(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        console.log('login success')
        localStorage.setItem('auth_token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true, message: response.message };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.log('login not a success')
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await api.register(email, password);
      
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true, message: response.message };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
        console.log(error)
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loadingAuth,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}