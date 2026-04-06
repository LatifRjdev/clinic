import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Appointment } from '../../scheduling/entities/appointment.entity';

export enum VideoSessionStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  ENDED = 'ended',
}

@Entity('video_sessions')
export class VideoSession extends BaseEntity {
  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId: string;

  @ManyToOne(() => Appointment, { eager: false })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { eager: false })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({
    type: 'enum',
    enum: VideoSessionStatus,
    default: VideoSessionStatus.WAITING,
  })
  status: VideoSessionStatus;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ name: 'room_url', type: 'varchar', nullable: true })
  roomUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
