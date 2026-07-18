import React, { createContext, useContext, useEffect, useState } from 'react';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { useGetMe } from '@workspace/api-client-react';
import { User } from '@workspace/api-client-react';
import { useLocation } from 'wouter';

setAuthTokenGetter(() => {
  return localStorage.getItem('debt_relief_token');
});

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('debt_relief_token'));
  const [location, setLocation] = useLocation();

  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: ['/api/auth/me', token],
      retry: false,
    }
  });

  const isLoading = !!token && isUserLoading;

  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error]);

  const login = (newToken: string, refreshToken: string, newUser: User) => {
    localStorage.setItem('debt_relief_token', newToken);
    localStorage.setItem('debt_relief_refresh', refreshToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('debt_relief_token');
    localStorage.removeItem('debt_relief_refresh');
    setToken(null);
    setLocation('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
