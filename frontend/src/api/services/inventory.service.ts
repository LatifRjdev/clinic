import apiClient from '../client';
import type { InventoryItem, InventoryMovement, PaginatedResponse } from '../../types';

export const inventoryService = {
  // Items
  findAll: (params?: { category?: string; branchId?: string; search?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<InventoryItem>>('/inventory/items', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<InventoryItem>(`/inventory/items/${id}`).then((r) => r.data),

  create: (data: Partial<InventoryItem>) =>
    apiClient.post<InventoryItem>('/inventory/items', data).then((r) => r.data),

  update: (id: string, data: Partial<InventoryItem>) =>
    apiClient.patch<InventoryItem>(`/inventory/items/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/inventory/items/${id}`),

  getLowStock: () =>
    apiClient.get<InventoryItem[]>('/inventory/low-stock').then((r) => r.data),

  getExpiring: (days?: number) =>
    apiClient.get<InventoryItem[]>('/inventory/expiring', { params: { days } }).then((r) => r.data),

  // Movements
  getMovements: (itemId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<InventoryMovement>>(`/inventory/movements/${itemId}`, { params }).then((r) => r.data),

  createMovement: (data: Partial<InventoryMovement>) =>
    apiClient.post<InventoryMovement>('/inventory/movements', data).then((r) => r.data),
};
