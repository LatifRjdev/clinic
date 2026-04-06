import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CounterpartyType {
  SUPPLIER = 'supplier',
  PARTNER = 'partner',
  LAB = 'lab',
  PHARMACY = 'pharmacy',
  OTHER = 'other',
}

@Entity('counterparties')
export class Counterparty extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: CounterpartyType, default: CounterpartyType.SUPPLIER })
  type: CounterpartyType;

  @Column({ type: 'varchar', nullable: true })
  inn: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ name: 'contact_person', type: 'varchar', nullable: true })
  contactPerson: string | null;

  @Column({ name: 'bank_name', type: 'varchar', nullable: true })
  bankName: string | null;

  @Column({ name: 'bank_account', type: 'varchar', nullable: true })
  bankAccount: string | null;

  @Column({ name: 'contract_number', type: 'varchar', nullable: true })
  contractNumber: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
