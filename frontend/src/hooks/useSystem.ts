import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemService } from '../api/services/system.service';

export const useSystemUsers = (params?: { role?: string; isActive?: boolean; search?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['system', 'users', params],
    queryFn: () => systemService.findAllUsers(params),
  });

export const useBlockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemService.blockUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'users'] }),
  });
};

export const useUnblockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemService.unblockUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'users'] }),
  });
};

export const useResetUserPassword = () =>
  useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      systemService.resetPassword(id, newPassword),
  });

export const useSystemSettings = (category?: string) =>
  useQuery({
    queryKey: ['system', 'settings', category],
    queryFn: () => systemService.getAllSettings(category),
  });

export const useUpsertSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { key: string; value: string; category?: string; description?: string; valueType?: string }) =>
      systemService.upsertSetting(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'settings'] }),
  });
};

export const useDeleteSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => systemService.deleteSetting(key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'settings'] }),
  });
};

export const useSystemLogs = (params?: { level?: string; source?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['system', 'logs', params],
    queryFn: () => systemService.getLogs(params),
  });
