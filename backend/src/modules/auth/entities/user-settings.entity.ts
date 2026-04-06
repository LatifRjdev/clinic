import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;
}
