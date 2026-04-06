import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('vital_signs')
export class VitalSigns extends BaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId: string | null;

  @Column({ name: 'systolic_bp', type: 'int', nullable: true })
  systolicBp: number | null;

  @Column({ name: 'diastolic_bp', type: 'int', nullable: true })
  diastolicBp: number | null;

  @Column({ name: 'heart_rate', type: 'int', nullable: true })
  heartRate: number | null;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number | null;

  @Column({ name: 'respiratory_rate', type: 'int', nullable: true })
  respiratoryRate: number | null;

  @Column({ name: 'spo2', type: 'int', nullable: true })
  spo2: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number | null;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  glucose: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'measured_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  measuredAt: Date;
}
