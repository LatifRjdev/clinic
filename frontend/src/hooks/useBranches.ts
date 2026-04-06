import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesService } from '../api/services/branches.service';
import type { Branch } from '../types';

export const useBranches = () =>
  useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesService.findAll(),
  });

export const useBranch = (id: string) =>
  useQuery({
    queryKey: ['branches', id],
    queryFn: () => branchesService.findOne(id),
    enabled: !!id,
  });

export const useCreateBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Branch>) => branchesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  });
};

export const useUpdateBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Branch> }) =>
      branchesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  });
};

export const useDeleteBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  });
};
