import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Room } from './room.entity';
import { AppointmentService } from './appointment-service.entity';

export enum AppointmentType {
  PRIMARY = 'primary',
  FOLLOW_UP = 'follow_up',
  PROCEDURE = 'procedure',
  CONSULTATION = 'consultation',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  WAITING_CONFIRMATION = 'waiting_confirmation',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentSource {
  RECEPTION = 'reception',
  ONLINE = 'online',
  REFERRAL = 'referral',
  WALK_IN = 'walk_in',
}

@Entity('appointments')
export class Appointment extends BaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { eager: false, lazy: false })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => User, { eager: false, lazy: false })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @Column({ name: 'room_id', type: 'uuid', nullable: true })
  roomId: string | null;

  @ManyToOne(() => Room, { eager: false, lazy: false, nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: Room | null;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId: string | null;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'start_time', type: 'varchar' })
  startTime: string;

  @Column({ name: 'end_time', type: 'varchar' })
  endTime: string;

  @Column({ type: 'enum', enum: AppointmentType })
  type: AppointmentType;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ name: 'cancellation_reason', type: 'varchar', nullable: true })
  cancellationReason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_online', default: false })
  isOnline: boolean;

  @Column({
    type: 'enum',
    enum: AppointmentSource,
    default: AppointmentSource.RECEPTION,
  })
  source: AppointmentSource;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ name: 'reminder_sent', default: false })
  reminderSent: boolean;

  @Column({ name: 'queue_position', type: 'int', nullable: true })
  queuePosition: number | null;

  @OneToMany(() => AppointmentService, (as) => as.appointment, { cascade: true })
  servicesRendered: AppointmentService[];
}
