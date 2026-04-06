import apiClient from '../client';
import type { Department } from '../../types';

export const departmentsService = {
  findAll: () =>
    apiClient.get<Department[]>('/staff/departments').then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Department>(`/staff/departments/${id}`).then((r) => r.data),

  create: (data: Partial<Department>) =>
    apiClient.post<Department>('/staff/departments', data).then((r) => r.data),

  update: (id: string, data: Partial<Department>) =>
    apiClient.patch<Department>(`/staff/departments/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/staff/departments/${id}`),
};
