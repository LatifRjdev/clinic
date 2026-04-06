import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('patients')
export class Patient extends BaseEntity {
  @Column({ name: 'medical_record_number', type: 'varchar', unique: true, nullable: true })
  medicalRecordNumber: string | null;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'middle_name', type: 'varchar', nullable: true })
  middleName: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ name: 'passport_number', type: 'varchar', nullable: true })
  passportNumber: string | null;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({ name: 'blood_type', type: 'varchar', nullable: true })
  bloodType: string | null;

  @Column({ type: 'text', nullable: true })
  allergies: string | null;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  source: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'consent_given', default: false })
  consentGiven: boolean;

  @Column({ name: 'consent_date', type: 'timestamp', nullable: true })
  consentDate: Date | null;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ name: 'insurance_policy_number', type: 'varchar', nullable: true })
  insurancePolicyNumber: string | null;

  @Column({ name: 'insurance_company_id', type: 'uuid', nullable: true })
  insuranceCompanyId: string | null;
}
