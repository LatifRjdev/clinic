import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
}

@Entity('loyalty_accounts')
export class LoyaltyAccount extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({
    name: 'total_spent',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalSpent: number;

  @Column({
    type: 'enum',
    enum: LoyaltyTier,
    default: LoyaltyTier.BRONZE,
  })
  tier: LoyaltyTier;
}
