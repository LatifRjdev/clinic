import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../auth/entities/user.entity';
import { Appointment } from '../../scheduling/entities/appointment.entity';

export enum MedicalRecordStatus {
  DRAFT = 'draft',
  SIGNED = 'signed',
  AMENDED = 'amended',
}

@Entity('medical_records')
export class MedicalRecord extends BaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { eager: false })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId: string | null;

  @ManyToOne(() => Appointment, { eager: false, nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment | null;

  @Column({ type: 'text' })
  complaints: string;

  @Column({ type: 'text' })
  anamnesis: string;

  @Column({ type: 'text' })
  examination: string;

  @Column()
  diagnosis: string;

  @Column({ name: 'diagnosis_code', type: 'varchar', nullable: true })
  diagnosisCode: string | null;

  @Column({ type: 'text', nullable: true })
  recommendations: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: MedicalRecordStatus,
    default: MedicalRecordStatus.DRAFT,
  })
  status: MedicalRecordStatus;

  @Column({ name: 'signed_at', type: 'timestamp', nullable: true })
  signedAt: Date | null;

  @Column({ name: 'signature_hash', type: 'varchar', nullable: true })
  signatureHash: string | null;

  @Column({ name: 'signed_by_id', type: 'uuid', nullable: true })
  signedById: string | null;

  @Column({ name: 'signature_image', type: 'text', nullable: true })
  signatureImage: string | null;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  attachments: { key: string; name: string; mimeType: string; size: number; uploadedAt: string }[];

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  amendments: {
    amendedBy: string;
    amendedAt: string;
    reason: string;
    previousContent: Record<string, any>;
    changedFields: string[];
  }[];
}
