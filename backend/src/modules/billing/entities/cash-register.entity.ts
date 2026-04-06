import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CashRegisterStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('cash_registers')
export class CashRegister extends BaseEntity {
  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ name: 'opened_by_id', type: 'uuid' })
  openedById: string;

  @Column({ name: 'closed_by_id', type: 'uuid', nullable: true })
  closedById: string | null;

  @Column({ name: 'opening_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  openingAmount: number;

  @Column({ name: 'closing_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  closingAmount: number | null;

  @Column({ name: 'cash_sales', type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashSales: number;

  @Column({ name: 'card_sales', type: 'decimal', precision: 12, scale: 2, default: 0 })
  cardSales: number;

  @Column({ name: 'encashment_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  encashmentAmount: number;

  @Column({
    type: 'enum',
    enum: CashRegisterStatus,
    default: CashRegisterStatus.OPEN,
  })
  status: CashRegisterStatus;

  @Column({ name: 'opened_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
