import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('branches')
export class Branch extends BaseEntity {
  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'jsonb', name: 'working_hours', nullable: true })
  workingHours: Record<string, { start: string; end: string }> | null;

  @Column({ name: 'is_main', default: false })
  isMain: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;
}
