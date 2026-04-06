import apiClient from '../client';
import type { Branch } from '../../types';

export const branchesService = {
  findAll: () =>
    apiClient.get<Branch[]>('/branches').then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Branch>(`/branches/${id}`).then((r) => r.data),

  create: (data: Partial<Branch>) =>
    apiClient.post<Branch>('/branches', data).then((r) => r.data),

  update: (id: string, data: Partial<Branch>) =>
    apiClient.patch<Branch>(`/branches/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/branches/${id}`),
};
