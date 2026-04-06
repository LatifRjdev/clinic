import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum PayrollStatus {
  DRAFT = 'draft',
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  PAID = 'paid',
}

@Entity('payroll_entries')
export class PayrollEntry extends BaseEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ name: 'base_salary', type: 'decimal', precision: 12, scale: 2, default: 0 })
  baseSalary: number;

  @Column({ name: 'service_bonus', type: 'decimal', precision: 12, scale: 2, default: 0 })
  serviceBonus: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deductions: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ name: 'net_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  netAmount: number;

  @Column({ name: 'services_count', type: 'int', default: 0 })
  servicesCount: number;

  @Column({ name: 'services_revenue', type: 'decimal', precision: 12, scale: 2, default: 0 })
  servicesRevenue: number;

  @Column({ name: 'bonus_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  bonusPercent: number;

  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status: PayrollStatus;

  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'deduction_reason', type: 'text', nullable: true })
  deductionReason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;
}
