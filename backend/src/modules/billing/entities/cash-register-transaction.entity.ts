import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CashRegister } from './cash-register.entity';

export enum CashRegisterTransactionType {
  CASH_IN = 'cash_in',
  CASH_OUT = 'cash_out',
  PAYMENT = 'payment',
  REFUND = 'refund',
  ENCASHMENT = 'encashment',
}

@Entity('cash_register_transactions')
export class CashRegisterTransaction extends BaseEntity {
  @Column({ name: 'cash_register_id', type: 'uuid' })
  cashRegisterId: string;

  @ManyToOne(() => CashRegister)
  @JoinColumn({ name: 'cash_register_id' })
  cashRegister: CashRegister;

  @Column({
    type: 'enum',
    enum: CashRegisterTransactionType,
  })
  type: CashRegisterTransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'performed_by_id', type: 'uuid' })
  performedById: string;
}
