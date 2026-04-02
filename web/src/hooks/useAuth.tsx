import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: any;
  isSubscriptionActive: boolean;
  loginState: (token: string) => void;
  logoutState: () => void;
  refreshUser: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  user: null,
  isSubscriptionActive: true,
  loginState: () => {},
  logoutState: () => {},
  refreshUser: async () => {},
});

import { AuthService } from '../services/auth.service';
import { useEffect } from 'react';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  
  const isAuthenticated = !!token;
  const isSubscriptionActive = !user || !user.pharmacy || 
    (user.pharmacy.subscriptions && user.pharmacy.subscriptions[0] && 
     new Date(user.pharmacy.subscriptions[0].expiresAt).getTime() > Date.now());

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await AuthService.getMe();
      setUser(data);
      return data;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // logoutState();
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token]);

  const loginState = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logoutState = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, isSubscriptionActive, loginState, logoutState, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
