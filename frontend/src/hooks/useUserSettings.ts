import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../api/services/auth.service';

export const useUserSettings = () =>
  useQuery({
    queryKey: ['user-settings'],
    queryFn: () => authService.getSettings(),
  });

export const useUpdateUserSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, any>) =>
      authService.updateSettings(settings),
    onSuccess: (data) => {
      qc.setQueryData(['user-settings'], data);
    },
  });
};
