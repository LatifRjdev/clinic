import apiClient from '../client';
import type { User, SystemSettings, SystemLog, PaginatedResponse } from '../../types';

export const systemService = {
  // User management
  findAllUsers: (params?: { role?: string; isActive?: boolean; search?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<User>>('/system/users', { params }).then((r) => r.data),

  blockUser: (id: string) =>
    apiClient.post(`/system/users/${id}/block`).then((r) => r.data),

  unblockUser: (id: string) =>
    apiClient.post(`/system/users/${id}/unblock`).then((r) => r.data),

  resetPassword: (id: string, newPassword: string) =>
    apiClient.post(`/system/users/${id}/reset-password`, { newPassword }),

  // Settings
  getAllSettings: (category?: string) =>
    apiClient.get<SystemSettings[]>('/system/settings', { params: { category } }).then((r) => r.data),

  getSetting: (key: string) =>
    apiClient.get<SystemSettings>(`/system/settings/${key}`).then((r) => r.data),

  upsertSetting: (data: { key: string; value: string; category?: string; description?: string; valueType?: string }) =>
    apiClient.patch<SystemSettings>('/system/settings', data).then((r) => r.data),

  deleteSetting: (key: string) =>
    apiClient.delete(`/system/settings/${key}`),

  // Logs
  getLogs: (params?: { level?: string; source?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<SystemLog>>('/system/logs', { params }).then((r) => r.data),
};
