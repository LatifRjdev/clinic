import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('services')
export class Service extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column()
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', comment: 'Default appointment duration in minutes' })
  duration: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;
}
