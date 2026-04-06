import apiClient from '../client';
import type { Appointment, DoctorSchedule, Room, PaginatedResponse } from '../../types';

export interface AppointmentFilters {
  doctorId?: string;
  patientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  roomId?: string;
  serviceId?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  source?: string;
  notes?: string;
  isOnline?: boolean;
  branchId?: string;
}

export interface DoctorListItem {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  role: string;
}

export const appointmentsService = {
  getDoctors: () =>
    apiClient.get<DoctorListItem[]>('/scheduling/appointments/doctors').then((r) => r.data),

  findAll: (params?: AppointmentFilters) =>
    apiClient.get<PaginatedResponse<Appointment>>('/scheduling/appointments', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Appointment>(`/scheduling/appointments/${id}`).then((r) => r.data),

  create: (data: CreateAppointmentData) =>
    apiClient.post<Appointment>('/scheduling/appointments', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateAppointmentData>) =>
    apiClient.patch<Appointment>(`/scheduling/appointments/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/scheduling/appointments/${id}`),

  findToday: () =>
    apiClient.get<Appointment[]>('/scheduling/appointments/today').then((r) => r.data),

  confirm: (id: string) =>
    apiClient.post<Appointment>(`/scheduling/appointments/${id}/confirm`).then((r) => r.data),

  reschedule: (id: string, date: string, startTime: string, endTime: string) =>
    apiClient.post<Appointment>(`/scheduling/appointments/${id}/reschedule`, { date, startTime, endTime }).then((r) => r.data),

  changeStatus: (id: string, status: string, cancellationReason?: string) =>
    apiClient.patch(`/scheduling/appointments/${id}/status`, { status, cancellationReason }).then((r) => r.data),

  findConflicts: (doctorId: string, date: string, startTime: string, endTime: string) =>
    apiClient.get<Appointment[]>('/scheduling/appointments/conflicts', {
      params: { doctorId, date, startTime, endTime },
    }).then((r) => r.data),

  addServices: (appointmentId: string, items: { serviceId: string; quantity: number; notes?: string }[], recordedBy: string) =>
    apiClient.post(`/scheduling/appointments/${appointmentId}/services`, { items, recordedBy }).then((r) => r.data),

  getServices: (appointmentId: string) =>
    apiClient.get(`/scheduling/appointments/${appointmentId}/services`).then((r) => r.data),

  removeServiceRecord: (appointmentId: string, serviceRecordId: string) =>
    apiClient.delete(`/scheduling/appointments/${appointmentId}/services/${serviceRecordId}`),
};

export const schedulesService = {
  findAll: (params?: { doctorId?: string }) =>
    apiClient.get<DoctorSchedule[]>('/scheduling/schedules', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<DoctorSchedule>(`/scheduling/schedules/${id}`).then((r) => r.data),

  create: (data: Partial<DoctorSchedule>) =>
    apiClient.post<DoctorSchedule>('/scheduling/schedules', data).then((r) => r.data),

  update: (id: string, data: Partial<DoctorSchedule>) =>
    apiClient.patch<DoctorSchedule>(`/scheduling/schedules/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/scheduling/schedules/${id}`),

  getSlots: (doctorId: string, date: string) =>
    apiClient.get(`/scheduling/schedules/${doctorId}/slots`, { params: { date } }).then((r) => r.data),
};

export const roomsService = {
  findAll: () =>
    apiClient.get<Room[]>('/scheduling/rooms').then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Room>(`/scheduling/rooms/${id}`).then((r) => r.data),

  create: (data: Partial<Room>) =>
    apiClient.post<Room>('/scheduling/rooms', data).then((r) => r.data),

  update: (id: string, data: Partial<Room>) =>
    apiClient.patch<Room>(`/scheduling/rooms/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/scheduling/rooms/${id}`),
};
