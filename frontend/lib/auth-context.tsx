'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, AuthResponse } from './types';
import { apiClient, setTokens, clearTokens, getAccessToken } from './api-client';
import { MockAPI } from './mock-data';

interface AuthContextType {
  user: User | null;
  roles: Role[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_MODE = typeof process.env.NEXT_PUBLIC_MOCK_MODE === 'undefined'
  ? true
  : process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          let userData: User;
          if (MOCK_MODE) {
            userData = await MockAPI.getMe();
          } else {
            // GET /api/auth/me/ — returns user data matching backend fields
            userData = await apiClient<User>('/auth/me/');
          }
          setUser(userData);
          setRoles(userData.roles || []);
        } catch (error) {
          clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      let response: AuthResponse;

      if (MOCK_MODE) {
        console.log('[AUTH] Modo mock activo, usando datos de demostración');
        response = await MockAPI.login(username, password);
      } else {
        console.log('[AUTH] Conectando con API real');
        response = await apiClient<AuthResponse>('/auth/login/', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
          skipAuth: true,
        });
      }

      setTokens(response.access, response.refresh);
      setUser(response.user);
      setRoles(response.roles);
      console.log('[AUTH] Login exitoso:', response.user.username || response.user.email);
    } catch (error) {
      console.error('[AUTH] Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setRoles([]);
  };

  const hasRole = (role: Role) => {
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
