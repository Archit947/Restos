import api from './axios';
import type { LoginCredentials, LoginResponse, SuperAdmin, ApiResponse } from '@/types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', credentials),

  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refreshToken }),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh-token', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  getProfile: () =>
    api.get<ApiResponse<SuperAdmin>>('/auth/me'),

  updateProfile: (data: FormData) =>
    api.put<ApiResponse<SuperAdmin>>('/auth/me', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};
