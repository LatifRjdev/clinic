import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ChatMessageType {
  TEXT = 'text',
  FILE = 'file',
  SYSTEM = 'system',
}

@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @Column({ name: 'chat_room_id', type: 'uuid' })
  chatRoomId: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ChatMessageType, default: ChatMessageType.TEXT })
  type: ChatMessageType;

  @Column({ name: 'file_url', type: 'varchar', nullable: true })
  fileUrl: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;
}
