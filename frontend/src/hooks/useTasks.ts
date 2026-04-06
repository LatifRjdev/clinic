import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '../api/services/tasks.service';
import type { Task } from '../types';

export const useTasks = (params?: { assigneeId?: string; status?: string; priority?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksService.findAll(params),
  });

export const useTask = (id: string) =>
  useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksService.findOne(id),
    enabled: !!id,
  });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) => tasksService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      tasksService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useChangeTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksService.changeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useAssignTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string }) =>
      tasksService.assignTask(id, assigneeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useTaskComments = (taskId: string) =>
  useQuery({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: () => tasksService.getComments(taskId),
    enabled: !!taskId,
  });

export const useAddTaskComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content, authorId }: { taskId: string; content: string; authorId: string }) =>
      tasksService.addComment(taskId, { content, authorId }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['tasks', variables.taskId, 'comments'] }),
  });
};
