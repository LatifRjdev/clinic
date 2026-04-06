import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ChatRoomType {
  DIRECT = 'direct',
  GROUP = 'group',
  DEPARTMENT = 'department',
}

@Entity('chat_rooms')
export class ChatRoom extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'enum', enum: ChatRoomType })
  type: ChatRoomType;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
