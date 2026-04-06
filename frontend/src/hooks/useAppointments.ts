import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService, schedulesService, roomsService, type AppointmentFilters, type CreateAppointmentData, type DoctorListItem } from '../api/services/scheduling.service';
import type { DoctorSchedule, Room } from '../types';

export const useAppointments = (params?: AppointmentFilters) =>
  useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentsService.findAll(params),
  });

export const useDoctors = () =>
  useQuery<DoctorListItem[]>({
    queryKey: ['scheduling-doctors'],
    queryFn: () => appointmentsService.getDoctors(),
  });

export const useAppointment = (id: string) =>
  useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentsService.findOne(id),
    enabled: !!id,
  });

export const useTodayAppointments = () =>
  useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => appointmentsService.findToday(),
  });

export const useCreateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentData) => appointmentsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useUpdateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAppointmentData> }) =>
      appointmentsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useConfirmAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.confirm(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useRescheduleAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date, startTime, endTime }: { id: string; date: string; startTime: string; endTime: string }) =>
      appointmentsService.reschedule(id, date, startTime, endTime),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useChangeAppointmentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, cancellationReason }: { id: string; status: string; cancellationReason?: string }) =>
      appointmentsService.changeStatus(id, status, cancellationReason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useDeleteAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useAppointmentServices = (appointmentId: string) =>
  useQuery({
    queryKey: ['appointments', appointmentId, 'services'],
    queryFn: () => appointmentsService.getServices(appointmentId),
    enabled: !!appointmentId,
  });

export const useAddAppointmentServices = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, items, recordedBy }: {
      appointmentId: string;
      items: { serviceId: string; quantity: number; notes?: string }[];
      recordedBy: string;
    }) => appointmentsService.addServices(appointmentId, items, recordedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useRemoveAppointmentService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, serviceRecordId }: { appointmentId: string; serviceRecordId: string }) =>
      appointmentsService.removeServiceRecord(appointmentId, serviceRecordId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

// Schedules
export const useSchedules = (params?: { doctorId?: string }) =>
  useQuery({
    queryKey: ['schedules', params],
    queryFn: () => schedulesService.findAll(params),
  });

export const useCreateSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DoctorSchedule>) => schedulesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
};

export const useUpdateSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DoctorSchedule> }) =>
      schedulesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
};

export const useSlots = (doctorId: string, date: string) =>
  useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn: () => schedulesService.getSlots(doctorId, date),
    enabled: !!doctorId && !!date,
  });

// Rooms
export const useRooms = () =>
  useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsService.findAll(),
  });

export const useCreateRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Room>) => roomsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
};

export const useUpdateRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Room> }) =>
      roomsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
};
