import apiClient, { TOKEN_STORAGE_KEY } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export const authApi = {
  /**
   * Register a new user
   */
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    });
    if (response.data.token) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
    }
    return response.data;
  },

  /**
   * Log in an existing user
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    if (response.data.token) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
    }
    return response.data;
  },

  /**
   * Get current authenticated user profile
   */
  getProfile: async (): Promise<{ success: boolean; user: User }> => {
    const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return response.data;
  },

  /**
   * Remove stored token upon logout
   */
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  /**
   * Check if a token exists in storage
   */
  getStoredToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  },
};
