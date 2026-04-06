import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('inventory_items')
export class InventoryItem extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  category: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ name: 'min_quantity', type: 'int', default: 0 })
  minQuantity: number;

  @Column({ name: 'reorder_level', type: 'int', nullable: true, default: 0 })
  reorderLevel: number;

  @Column()
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  manufacturer: string | null;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
