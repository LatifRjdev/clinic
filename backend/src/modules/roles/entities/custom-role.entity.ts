import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('custom_roles')
export class CustomRole extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  permissions: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'base_role', type: 'varchar', nullable: true })
  baseRole: string | null;
}
