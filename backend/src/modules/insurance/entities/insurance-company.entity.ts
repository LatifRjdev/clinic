import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('insurance_companies')
export class InsuranceCompany extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ name: 'contact_person', type: 'varchar', nullable: true })
  contactPerson: string | null;

  @Column({ name: 'contract_number', type: 'varchar', nullable: true })
  contractNumber: string | null;

  @Column({ name: 'contract_start', type: 'date', nullable: true })
  contractStart: Date | null;

  @Column({ name: 'contract_end', type: 'date', nullable: true })
  contractEnd: Date | null;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
