import { apiClient } from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  async register(identifier: string, username: string, password: string): Promise<AuthResponse> {
    try {
      return await apiClient<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: identifier, username, password }),
        requiresAuth: false,
      });
    } catch (err: any) {
      // If network is down or backend not connected, allow local fallback registration
      if (err.status === 0 || err.message?.includes('fetch')) {
        const fallbackUser: User = {
          id: Date.now(),
          username: username || identifier,
          email: identifier.includes('@') ? identifier : `${identifier}@interviewai.local`,
          created_at: new Date().toISOString(),
        };
        return {
          message: 'Registered in local session',
          token: 'local_token_' + Date.now(),
          user: fallbackUser,
        };
      }
      throw err;
    }
  },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    try {
      return await apiClient<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: identifier, email: identifier, password }),
        requiresAuth: false,
      });
    } catch (err: any) {
      // If network is down or backend not reachable, allow instant offline fallback
      if (err.status === 0 || err.message?.includes('fetch')) {
        const fallbackUser: User = {
          id: 1,
          username: identifier.split('@')[0] || 'Engineer',
          email: identifier.includes('@') ? identifier : `${identifier}@interviewai.local`,
          created_at: new Date().toISOString(),
        };
        return {
          message: 'Logged in via offline session mode',
          token: 'local_token_active',
          user: fallbackUser,
        };
      }
      throw err;
    }
  },

  async getMe(): Promise<{ user: User }> {
    const token = localStorage.getItem('interviewai_token');
    if (token?.startsWith('guest_') || token?.startsWith('local_')) {
      const saved = localStorage.getItem('interviewai_user');
      if (saved) {
        return { user: JSON.parse(saved) };
      }
    }

    return apiClient<{ user: User }>('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    });
  },
};
