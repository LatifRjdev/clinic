import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ReferralPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

export enum ReferralStatus {
  CREATED = 'created',
  SCHEDULED = 'scheduled',
  ACCEPTED = 'accepted',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('referrals')
export class Referral extends BaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'referring_doctor_id', type: 'uuid' })
  referringDoctorId: string;

  @Column({ name: 'target_doctor_id', type: 'uuid', nullable: true })
  targetDoctorId: string | null;

  @Column({ name: 'target_specialty' })
  targetSpecialty: string;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId: string | null;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: ReferralPriority,
    default: ReferralPriority.ROUTINE,
  })
  priority: ReferralPriority;

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.CREATED,
  })
  status: ReferralStatus;

  @Column({ name: 'target_branch_id', type: 'uuid', nullable: true })
  targetBranchId: string | null;

  @Column({ name: 'is_inter_branch', type: 'boolean', default: false })
  isInterBranch: boolean;
}
