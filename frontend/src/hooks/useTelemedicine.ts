import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telemedicineService } from '../api/services/telemedicine.service';

export const useVideoSessions = (params?: { doctorId?: string; patientId?: string; status?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['video-sessions', params],
    queryFn: () => telemedicineService.getSessions(params),
  });

export const useVideoSession = (id: string) =>
  useQuery({
    queryKey: ['video-sessions', id],
    queryFn: () => telemedicineService.getSession(id),
    enabled: !!id,
  });

export const useCreateVideoSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { appointmentId: string; doctorId: string; patientId: string }) =>
      telemedicineService.createSession(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['video-sessions'] }),
  });
};

export const useStartVideoSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => telemedicineService.startSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['video-sessions'] }),
  });
};

export const useEndVideoSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => telemedicineService.endSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['video-sessions'] }),
  });
};
