import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum SalaryType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  MIXED = 'mixed',
}

@Entity('staff_profiles')
export class StaffProfile extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  specialty: string | null;

  @Column({ name: 'license_number', type: 'varchar', nullable: true })
  licenseNumber: string | null;

  @Column({ type: 'text', nullable: true })
  education: string | null;

  @Column({ type: 'text', nullable: true })
  experience: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'salary_type', type: 'enum', enum: SalaryType })
  salaryType: SalaryType;

  @Column({ name: 'salary_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  salaryAmount: number | null;

  @Column({ name: 'salary_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  salaryPercentage: number | null;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;
}
