import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SearchMessagesDto } from './dto/search-messages.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatRoomMember)
    private readonly chatRoomMemberRepository: Repository<ChatRoomMember>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async createRoom(createRoomDto: CreateRoomDto): Promise<ChatRoom> {
    const room = this.chatRoomRepository.create({
      name: createRoomDto.name,
      type: createRoomDto.type,
    });
    const savedRoom = await this.chatRoomRepository.save(room);

    const members = createRoomDto.memberIds.map((userId) =>
      this.chatRoomMemberRepository.create({
        chatRoomId: savedRoom.id,
        userId,
      }),
    );
    await this.chatRoomMemberRepository.save(members);

    return savedRoom;
  }

  async addMember(chatRoomId: string, userId: string): Promise<ChatRoomMember> {
    const room = await this.chatRoomRepository.findOne({ where: { id: chatRoomId } });
    if (!room) {
      throw new NotFoundException(`Chat room with ID "${chatRoomId}" not found`);
    }

    const member = this.chatRoomMemberRepository.create({
      chatRoomId,
      userId,
    });
    return this.chatRoomMemberRepository.save(member);
  }

  async sendMessage(chatRoomId: string, sendMessageDto: SendMessageDto): Promise<ChatMessage> {
    const room = await this.chatRoomRepository.findOne({ where: { id: chatRoomId } });
    if (!room) {
      throw new NotFoundException(`Chat room with ID "${chatRoomId}" not found`);
    }

    const message = this.chatMessageRepository.create({
      chatRoomId,
      senderId: sendMessageDto.senderId,
      content: sendMessageDto.content,
      type: sendMessageDto.type,
      fileUrl: sendMessageDto.fileUrl,
    });
    return this.chatMessageRepository.save(message);
  }

  async getMessages(chatRoomId: string, searchDto: SearchMessagesDto) {
    const { query, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'DESC' } = searchDto;

    const qb = this.chatMessageRepository
      .createQueryBuilder('message')
      .where('message.chat_room_id = :chatRoomId', { chatRoomId });

    if (query) {
      qb.andWhere('message.content ILIKE :query', { query: `%${query}%` });
    }

    qb.orderBy(`message.${sortBy}`, sortOrder);
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRoomsForUser(userId: string): Promise<ChatRoom[]> {
    const members = await this.chatRoomMemberRepository.find({
      where: { userId, leftAt: undefined },
    });

    if (members.length === 0) {
      return [];
    }

    const roomIds = members.map((m) => m.chatRoomId);
    return this.chatRoomRepository
      .createQueryBuilder('room')
      .where('room.id IN (:...roomIds)', { roomIds })
      .andWhere('room.is_active = :isActive', { isActive: true })
      .getMany();
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.chatMessageRepository.update(messageId, { isRead: true });
  }

  async markAllAsRead(chatRoomId: string, userId: string): Promise<void> {
    await this.chatMessageRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ isRead: true })
      .where('chat_room_id = :chatRoomId', { chatRoomId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('is_read = :isRead', { isRead: false })
      .execute();
  }
}
