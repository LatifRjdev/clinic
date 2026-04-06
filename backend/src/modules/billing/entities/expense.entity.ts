import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ExpenseCategory {
  SALARY = 'salary',
  RENT = 'rent',
  UTILITIES = 'utilities',
  SUPPLIES = 'supplies',
  EQUIPMENT = 'equipment',
  MARKETING = 'marketing',
  INSURANCE = 'insurance',
  TAXES = 'taxes',
  OTHER = 'other',
}

@Entity('expenses')
export class Expense extends BaseEntity {
  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.OTHER,
  })
  category: ExpenseCategory;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: Date;

  @Column({ name: 'paid_to', type: 'varchar', nullable: true })
  paidTo: string | null;

  @Column({ name: 'receipt_url', type: 'varchar', nullable: true })
  receiptUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById: string | null;

  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;
}
