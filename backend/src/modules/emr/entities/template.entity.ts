import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('templates')
export class Template extends BaseEntity {
  @Column()
  name: string;

  @Column()
  specialty: string;

  @Column({ type: 'jsonb' })
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
  }>;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;
}
