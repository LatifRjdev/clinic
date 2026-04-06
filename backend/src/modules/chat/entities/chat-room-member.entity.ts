import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('chat_room_members')
export class ChatRoomMember extends BaseEntity {
  @Column({ name: 'chat_room_id', type: 'uuid' })
  chatRoomId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'joined_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt: Date | null;
}
