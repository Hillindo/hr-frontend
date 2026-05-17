'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  loginApi,
  logoutApi,
  getMe,
  getAuthToken,
  clearAuthTokens,
  HttpError,
  type LoginRequest,
  type LoginResponse,
} from '@/lib/api/http';

interface AuthUser {
  id: string;
  email: string;
  status: string;
  isPlatformAdmin?: boolean;
  permissionCodes?: string[];
  roleCodes?: string[];
  employeeId?: string;
  tenantId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await getMe();
      setUser({
        id: me.user.id,
        email: me.user.email,
        status: me.user.status,
        isPlatformAdmin: me.isPlatformAdmin || me.user.isPlatformAdmin,
        permissionCodes: me.tenantContext?.permissionCodes || [],
        roleCodes: me.tenantContext?.roleCodes || me.activeMembership?.roleCodes || [],
        employeeId: me.tenantContext?.employeeId || me.activeMembership?.employeeId,
        tenantId: me.activeTenant?.id,
      });
    } catch {
      setUser(null);
      clearAuthTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (data: LoginRequest): Promise<LoginResponse> => {
    setError(null);
    try {
      const result = await loginApi(data);
      setUser({
        id: result.user.id,
        email: result.user.email,
        status: result.user.status,
        isPlatformAdmin: result.isPlatformAdmin,
        permissionCodes: result.tenantContext?.permissionCodes || [],
        roleCodes: result.tenantContext?.roleCodes || result.activeMembership?.roleCodes || [],
        employeeId: result.tenantContext?.employeeId || result.activeMembership?.employeeId,
        tenantId: result.activeTenant?.id,
      });
      return result;
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      clearAuthTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.isPlatformAdmin) return true;
    return user.permissionCodes?.includes(permission) ?? false;
  }, [user]);

  const hasAnyPermission = useCallback((...permissions: string[]): boolean => {
    if (!user) return false;
    if (user.isPlatformAdmin) return true;
    return permissions.some(p => user.permissionCodes?.includes(p) ?? false);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isPlatformAdmin: user?.isPlatformAdmin === true,
        login,
        logout,
        error,
        hasPermission,
        hasAnyPermission,
      }}
    >
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
