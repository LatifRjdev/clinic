import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('notification_settings')
export class NotificationSettings extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'email_enabled', default: true })
  emailEnabled: boolean;

  @Column({ name: 'sms_enabled', default: false })
  smsEnabled: boolean;

  @Column({ name: 'telegram_enabled', default: false })
  telegramEnabled: boolean;

  @Column({ name: 'push_enabled', default: true })
  pushEnabled: boolean;

  @Column({ name: 'appointment_reminders', default: true })
  appointmentReminders: boolean;

  @Column({ name: 'message_notifications', default: true })
  messageNotifications: boolean;

  @Column({ name: 'task_notifications', default: true })
  taskNotifications: boolean;

  @Column({ name: 'referral_notifications', default: true })
  referralNotifications: boolean;

  @Column({ name: 'system_notifications', default: true })
  systemNotifications: boolean;

  @Column({ name: 'telegram_chat_id', type: 'varchar', nullable: true })
  telegramChatId: string | null;
}
