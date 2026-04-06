import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('prescriptions')
export class Prescription extends BaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @Column({ name: 'medical_record_id', type: 'uuid' })
  medicalRecordId: string;

  @Column({ name: 'medication_name' })
  medicationName: string;

  @Column()
  dosage: string;

  @Column()
  frequency: string;

  @Column({ type: 'varchar', nullable: true })
  duration: string | null;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
