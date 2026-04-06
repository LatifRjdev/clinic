import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../api/services/inventory.service';
import type { InventoryItem, InventoryMovement } from '../types';

export const useInventoryItems = (params?: { category?: string; branchId?: string; search?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryService.findAll(params),
  });

export const useInventoryItem = (id: string) =>
  useQuery({
    queryKey: ['inventory', id],
    queryFn: () => inventoryService.findOne(id),
    enabled: !!id,
  });

export const useLowStock = () =>
  useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryService.getLowStock(),
  });

export const useExpiringItems = (days?: number) =>
  useQuery({
    queryKey: ['inventory', 'expiring', days],
    queryFn: () => inventoryService.getExpiring(days),
  });

export const useCreateInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) => inventoryService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
};

export const useUpdateInventoryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) =>
      inventoryService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
};

export const useCreateMovement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InventoryMovement>) => inventoryService.createMovement(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
};

export const useInventoryMovements = (itemId: string) =>
  useQuery({
    queryKey: ['inventory', itemId, 'movements'],
    queryFn: () => inventoryService.getMovements(itemId),
    enabled: !!itemId,
  });
