import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('payroll_settings')
export class PayrollSettings extends BaseEntity {
  @Column({ name: 'employee_id', type: 'uuid', unique: true })
  employeeId: string;

  @Column({ name: 'base_salary', type: 'decimal', precision: 12, scale: 2, default: 0 })
  baseSalary: number;

  @Column({ name: 'bonus_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  bonusPercent: number;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 13 })
  taxRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
