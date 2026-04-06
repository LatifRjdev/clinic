import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../api/services/chat.service';

export const useChatRooms = () =>
  useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: () => chatService.getRooms(),
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
    mutationFn: (data: { name?: string; type: string; participantIds: string[] }) =>
      chatService.createRoom(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat', 'rooms'] }),
  });
};

export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => chatService.markAllAsRead(roomId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat'] }),
  });
};
