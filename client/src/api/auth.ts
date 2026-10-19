import { apiClient } from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
      requiresAuth: false,
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
    });
  },

  async getMe(): Promise<{ user: User }> {
    return apiClient<{ user: User }>('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    });
  },
};
