import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('promotions')
export class Promotion extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercent: number | null;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountAmount: number | null;

  @Column({ name: 'promo_code', type: 'varchar', unique: true, nullable: true })
  promoCode: string | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses: number | null;

  @Column({ name: 'current_uses', type: 'int', default: 0 })
  currentUses: number;

  @Column({ name: 'service_ids', type: 'simple-array', nullable: true })
  serviceIds: string[] | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;
}
