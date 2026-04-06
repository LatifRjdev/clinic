import apiClient from '../client';
import type { ChatRoom, ChatMessage, PaginatedResponse } from '../../types';

export const chatService = {
  getRooms: (userId: string) =>
    apiClient.get<ChatRoom[]>('/chat/rooms', { params: { userId } }).then((r) => r.data),

  createRoom: (data: { name?: string; type: string; memberIds: string[] }) =>
    apiClient.post<ChatRoom>('/chat/rooms', data).then((r) => r.data),

  getMessages: (roomId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<ChatMessage>>(`/chat/rooms/${roomId}/messages`, { params }).then((r) => r.data),

  markAllAsRead: (roomId: string, userId: string) =>
    apiClient.patch(`/chat/rooms/${roomId}/read`, { userId }).then((r) => r.data),

  uploadFile: (file: File, folder: string = 'chat') => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<{ url: string; key: string }>('/storage/upload', formData, {
        params: { folder },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
