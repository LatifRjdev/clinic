import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('system_settings')
export class SystemSettings extends BaseEntity {
  @Column({ unique: true })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'value_type', default: 'string' })
  valueType: string; // string, number, boolean, json
}
