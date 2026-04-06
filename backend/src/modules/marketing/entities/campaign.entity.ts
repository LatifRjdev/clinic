import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CampaignChannel {
  SMS = 'sms',
  EMAIL = 'email',
  TELEGRAM = 'telegram',
}

@Entity('campaigns')
export class Campaign extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: CampaignChannel })
  channel: CampaignChannel;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'target_audience', type: 'jsonb', nullable: true })
  targetAudience: Record<string, any> | null;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'recipients_count', type: 'int', default: 0 })
  recipientsCount: number;

  @Column({ name: 'delivered_count', type: 'int', default: 0 })
  deliveredCount: number;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;
}
