import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsService } from '../api/services/departments.service';
import type { Department } from '../types';

export const useDepartments = () =>
  useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsService.findAll(),
  });

export const useCreateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Department>) => departmentsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
};

export const useUpdateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
      departmentsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
};

export const useDeleteDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
};
