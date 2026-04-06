import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn(`Connection rejected (no token): ${client.id}`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub as string;

      if (!userId) {
        this.logger.warn(`Connection rejected (invalid payload): ${client.id}`);
        client.emit('error', { message: 'Invalid token payload' });
        client.disconnect(true);
        return;
      }

      // Store authenticated userId on the socket for later use
      client.data.userId = userId;

      this.logger.log(`Client connected: ${client.id}, userId: ${userId}`);

      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);

      // Broadcast user online
      this.server.emit('userOnline', { userId });
    } catch (err) {
      this.logger.warn(
        `Connection rejected (token verification failed): ${client.id} - ${err.message}`,
      );
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string;
    this.logger.log(`Client disconnected: ${client.id}`);

    if (userId && this.onlineUsers.has(userId)) {
      this.onlineUsers.get(userId)!.delete(client.id);
      if (this.onlineUsers.get(userId)!.size === 0) {
        this.onlineUsers.delete(userId);
        // Broadcast user offline
        this.server.emit('userOffline', { userId });
      }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatRoomId: string },
  ) {
    client.join(payload.chatRoomId);
    client.to(payload.chatRoomId).emit('userJoined', {
      clientId: client.id,
      userId: client.data.userId,
    });
    return { event: 'joinedRoom', data: { chatRoomId: payload.chatRoomId } };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatRoomId: string },
  ) {
    client.leave(payload.chatRoomId);
    client.to(payload.chatRoomId).emit('userLeft', {
      clientId: client.id,
      userId: client.data.userId,
    });
    return { event: 'leftRoom', data: { chatRoomId: payload.chatRoomId } };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatRoomId: string } & SendMessageDto,
  ) {
    const { chatRoomId, ...messageDto } = payload;
    const message = await this.chatService.sendMessage(chatRoomId, messageDto);
    this.server.to(chatRoomId).emit('newMessage', message);
    return { event: 'messageSent', data: message };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatRoomId: string; userId: string },
  ) {
    client.to(payload.chatRoomId).emit('userTyping', {
      userId: payload.userId,
      chatRoomId: payload.chatRoomId,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatRoomId: string; userId: string },
  ) {
    client.to(payload.chatRoomId).emit('userStoppedTyping', {
      userId: payload.userId,
      chatRoomId: payload.chatRoomId,
    });
  }

  @SubscribeMessage('messageRead')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; chatRoomId: string; userId: string },
  ) {
    await this.chatService.markAsRead(payload.messageId);
    client.to(payload.chatRoomId).emit('messageRead', {
      messageId: payload.messageId,
      userId: payload.userId,
    });
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const users = Array.from(this.onlineUsers.keys());
    client.emit('onlineUsersList', { users });
    return { event: 'onlineUsersList', data: { users } };
  }

  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}
