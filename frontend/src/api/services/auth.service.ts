import apiClient from '../client';
import type { User } from '../../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface InviteRequest {
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
  branchId?: string;
  specialty?: string;
}

export const authService = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  getProfile: () =>
    apiClient.get<User>('/auth/profile').then((r) => r.data),

  updateProfile: (data: Partial<User>) =>
    apiClient.patch<User>('/auth/profile', data).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  verifyCode: (email: string, code: string) =>
    apiClient.post('/auth/verify-code', { email, code }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { email, code, newPassword }),

  invite: (data: InviteRequest) =>
    apiClient.post('/auth/invite', data).then((r) => r.data),

  acceptInvite: (token: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/accept-invite', { token, password }).then((r) => r.data),

  selectBranch: (branchId: string) =>
    apiClient.post('/auth/select-branch', { branchId }).then((r) => r.data),

  getSettings: () =>
    apiClient.get<Record<string, any>>('/auth/settings').then((r) => r.data),

  updateSettings: (settings: Record<string, any>) =>
    apiClient.patch<Record<string, any>>('/auth/settings', { settings }).then((r) => r.data),
};
