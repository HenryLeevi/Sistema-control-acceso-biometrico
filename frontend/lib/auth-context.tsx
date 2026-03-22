'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, AuthResponse, normalizeRole } from './types';
import { apiClient, setTokens, clearTokens, getAccessToken } from './api-client';

interface AuthContextType {
  user: User | null;
  roles: Role[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ roles: Role[] }>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          // GET /api/auth/me/ returns user data + roles
          const meData = await apiClient<User & { roles?: string[] }>('/auth/me/');
          // Normalize roles to uppercase
          const normalizedRoles = (meData.roles || []).map(normalizeRole);
          setUser({ ...meData, roles: normalizedRoles });
          setRoles(normalizedRoles);
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
      console.log('[AUTH] Conectando con API real');
      const response = await apiClient<AuthResponse>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        skipAuth: true,
      });

      // Normalize roles to uppercase
      const normalizedRoles = (response.roles || []).map(normalizeRole);

      setTokens(response.access, response.refresh);
      setUser({ ...response.user, roles: normalizedRoles });
      setRoles(normalizedRoles);
      console.log('[AUTH] Login exitoso:', response.user.username || response.user.email, '| roles:', normalizedRoles);
      return { roles: normalizedRoles };
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
    return roles.map(r => r.toUpperCase()).includes(role.toUpperCase());
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
