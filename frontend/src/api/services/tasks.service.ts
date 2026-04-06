import apiClient from '../client';
import type { Task, TaskComment, PaginatedResponse } from '../../types';

export const tasksService = {
  findAll: (params?: { assigneeId?: string; status?: string; priority?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Task>>('/tasks', { params }).then((r) => r.data),

  findOne: (id: string) =>
    apiClient.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (data: Partial<Task>) =>
    apiClient.post<Task>('/tasks', data).then((r) => r.data),

  update: (id: string, data: Partial<Task>) =>
    apiClient.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/tasks/${id}`),

  changeStatus: (id: string, status: string) =>
    apiClient.patch<Task>(`/tasks/${id}/status`, { status }).then((r) => r.data),

  assignTask: (id: string, assigneeId: string) =>
    apiClient.post<Task>(`/tasks/${id}/assign`, { assigneeId }).then((r) => r.data),

  getComments: (taskId: string) =>
    apiClient.get<TaskComment[]>(`/tasks/${taskId}/comments`).then((r) => r.data),

  addComment: (taskId: string, data: { content: string; authorId: string }) =>
    apiClient.post<TaskComment>(`/tasks/${taskId}/comments`, data).then((r) => r.data),
};
