import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../api/services/notifications.service';
import type { NotificationSettings } from '../types';

export const useNotifications = (params?: { isRead?: boolean; type?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsService.findAll(params),
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useNotificationSettings = (userId: string) =>
  useQuery({
    queryKey: ['notification-settings', userId],
    queryFn: () => notificationsService.getSettings(userId),
    enabled: !!userId,
  });

export const useUpdateNotificationSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<NotificationSettings> }) =>
      notificationsService.updateSettings(userId, data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['notification-settings', variables.userId] }),
  });
};
