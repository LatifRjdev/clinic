import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum MovementType {
  RECEIPT = 'receipt',
  CONSUMPTION = 'consumption',
  WRITE_OFF = 'write_off',
  TRANSFER = 'transfer',
}

@Entity('inventory_movements')
export class InventoryMovement extends BaseEntity {
  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice: number | null;

  @Column({ name: 'performed_by_id', type: 'uuid' })
  performedById: string;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId: string | null;

  @Column({ name: 'from_branch_id', type: 'uuid', nullable: true })
  fromBranchId: string | null;

  @Column({ name: 'to_branch_id', type: 'uuid', nullable: true })
  toBranchId: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
