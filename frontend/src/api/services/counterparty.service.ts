import apiClient from '../client';
import type { Counterparty, PaginatedResponse } from '../../types';

export const counterpartyService = {
  findAll: (params?: { type?: string; isActive?: boolean; search?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Counterparty>>('/counterparties', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Counterparty>(`/counterparties/${id}`).then((r) => r.data),

  create: (data: Partial<Counterparty>) =>
    apiClient.post<Counterparty>('/counterparties', data).then((r) => r.data),

  update: (id: string, data: Partial<Counterparty>) =>
    apiClient.patch<Counterparty>(`/counterparties/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/counterparties/${id}`),
};
