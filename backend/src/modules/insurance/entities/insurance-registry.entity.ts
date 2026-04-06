import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum RegistryStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PAID = 'paid',
}

@Entity('insurance_registries')
export class InsuranceRegistry extends BaseEntity {
  @Column({ name: 'insurance_company_id', type: 'uuid' })
  insuranceCompanyId: string;

  @Column({ name: 'registry_number', unique: true })
  registryNumber: string;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'items_count', type: 'int', default: 0 })
  itemsCount: number;

  @Column({ type: 'enum', enum: RegistryStatus, default: RegistryStatus.DRAFT })
  status: RegistryStatus;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
