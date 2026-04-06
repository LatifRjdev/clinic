import apiClient from '../client';

export interface VideoSession {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  status: 'waiting' | 'active' | 'ended';
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  roomUrl?: string;
  notes?: string;
  doctor?: { id: string; firstName: string; lastName: string; specialty?: string };
  patient?: { id: string; firstName: string; lastName: string };
  appointment?: { id: string; date: string; startTime: string; endTime: string };
  createdAt: string;
}

export const telemedicineService = {
  getSessions: (params?: { doctorId?: string; patientId?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get('/telemedicine/sessions', { params }).then((r) => r.data),

  getSession: (id: string) =>
    apiClient.get(`/telemedicine/sessions/${id}`).then((r) => r.data),

  createSession: (data: { appointmentId: string; doctorId: string; patientId: string }) =>
    apiClient.post('/telemedicine/sessions', data).then((r) => r.data),

  startSession: (id: string) =>
    apiClient.post(`/telemedicine/sessions/${id}/start`).then((r) => r.data),

  endSession: (id: string) =>
    apiClient.post(`/telemedicine/sessions/${id}/end`).then((r) => r.data),

  deleteSession: (id: string) =>
    apiClient.delete(`/telemedicine/sessions/${id}`),
};
