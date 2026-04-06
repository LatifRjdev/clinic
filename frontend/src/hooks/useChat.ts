import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../api/services/chat.service';

export const useChatRooms = (userId: string) =>
  useQuery({
    queryKey: ['chat', 'rooms', userId],
    queryFn: () => chatService.getRooms(userId),
    enabled: !!userId,
  });

export const useChatMessages = (roomId: string, params?: { page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['chat', 'messages', roomId, params],
    queryFn: () => chatService.getMessages(roomId, params),
    enabled: !!roomId,
  });

export const useCreateChatRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; type: string; memberIds: string[] }) =>
      chatService.createRoom(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat', 'rooms'] }),
  });
};

export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, userId }: { roomId: string; userId: string }) => chatService.markAllAsRead(roomId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat'] }),
  });
};
