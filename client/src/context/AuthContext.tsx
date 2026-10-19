import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (identifier: string, username: string, password: string) => Promise<void>;
  loginAsGuest: (guestName?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('interviewai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('interviewai_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('interviewai_token');
      if (storedToken) {
        if (storedToken.startsWith('guest_') || storedToken.startsWith('local_')) {
          // Guest or offline session: keep without remote call
          setIsLoading(false);
          return;
        }

        try {
          const res = await authApi.getMe();
          setUser(res.user);
          localStorage.setItem('interviewai_user', JSON.stringify(res.user));
        } catch (error) {
          console.warn('Backend session unreachable, keeping local session if available');
          const saved = localStorage.getItem('interviewai_user');
          if (!saved) {
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await authApi.login(identifier, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('interviewai_token', res.token);
    localStorage.setItem('interviewai_user', JSON.stringify(res.user));
  };

  const register = async (identifier: string, username: string, password: string) => {
    const res = await authApi.register(identifier, username, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('interviewai_token', res.token);
    localStorage.setItem('interviewai_user', JSON.stringify(res.user));
  };

  const loginAsGuest = (guestName: string = 'Guest Engineer') => {
    const guestUser: User = {
      id: 999,
      username: guestName,
      email: `${guestName.toLowerCase().replace(/\s+/g, '_')}@guest.local`,
      created_at: new Date().toISOString(),
    };
    const guestToken = 'guest_token_demo';
    setToken(guestToken);
    setUser(guestUser);
    localStorage.setItem('interviewai_token', guestToken);
    localStorage.setItem('interviewai_user', JSON.stringify(guestUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('interviewai_token');
    localStorage.removeItem('interviewai_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        loginAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
