import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  serverUrl: string;
  userEmail: string;
}

interface AuthContextType extends AuthState {
  login: (serverUrl: string, accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  isAuthenticated: false,
  serverUrl: '',
  userEmail: '',
  login: async () => {},
  logout: async () => {},
  checkAuth: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    serverUrl: '',
    userEmail: '',
  });

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const hasCredentials = await api.init();
      if (hasCredentials) {
        const userResp = await api.getCurrentUser();
        setState({
          isLoading: false,
          isAuthenticated: true,
          serverUrl: api.getServerUrl(),
          userEmail: userResp?.data?.attributes?.email || '',
        });
        return true;
      }
    } catch (e) {
      // credentials invalid
    }
    setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
    return false;
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (serverUrl: string, accessToken: string) => {
    await api.saveCredentials(serverUrl, accessToken);
    try {
      const userResp = await api.getCurrentUser();
      setState({
        isLoading: false,
        isAuthenticated: true,
        serverUrl: api.getServerUrl(),
        userEmail: userResp?.data?.attributes?.email || '',
      });
    } catch (e) {
      await api.clearCredentials();
      throw new Error('Failed to authenticate. Please check your server URL and token.');
    }
  }, []);

  const logout = useCallback(async () => {
    await api.clearCredentials();
    setState({
      isLoading: false,
      isAuthenticated: false,
      serverUrl: '',
      userEmail: '',
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
