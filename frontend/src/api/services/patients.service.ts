import apiClient from '../client';
import type { Patient, PaginatedResponse } from '../../types';

export interface PatientFilters {
  search?: string;
  gender?: string;
  page?: number;
  limit?: number;
}

export const patientsService = {
  findAll: (params?: PatientFilters) =>
    apiClient.get<PaginatedResponse<Patient>>('/patients', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Patient>(`/patients/${id}`).then((r) => r.data),

  create: (data: Partial<Patient>) =>
    apiClient.post<Patient>('/patients', data).then((r) => r.data),

  update: (id: string, data: Partial<Patient>) =>
    apiClient.patch<Patient>(`/patients/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/patients/${id}`),

  search: (query: string) =>
    apiClient.get<Patient[]>('/patients/search', { params: { q: query } }).then((r) => r.data),

  getHistory: (id: string) =>
    apiClient.get(`/patients/${id}/history`).then((r) => r.data),

  getTimeline: (id: string) =>
    apiClient.get(`/patients/${id}/timeline`).then((r) => r.data),

  recordConsent: (id: string) =>
    apiClient.post(`/patients/${id}/consent`).then((r) => r.data),
};
