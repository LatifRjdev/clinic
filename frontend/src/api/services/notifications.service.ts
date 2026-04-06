import apiClient from '../client';
import type { Notification, NotificationSettings, PaginatedResponse } from '../../types';

export const notificationsService = {
  findAll: (params?: { isRead?: boolean; type?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Notification>>('/notifications', { params }).then((r) => r.data),

  markAsRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    apiClient.patch('/notifications/read-all').then((r) => r.data),

  getSettings: (userId: string) =>
    apiClient.get<NotificationSettings>(`/notifications/settings/${userId}`).then((r) => r.data),

  updateSettings: (userId: string, data: Partial<NotificationSettings>) =>
    apiClient.patch<NotificationSettings>(`/notifications/settings/${userId}`, data).then((r) => r.data),
};
