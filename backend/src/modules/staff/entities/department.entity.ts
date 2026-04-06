import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'head_doctor_id', type: 'uuid', nullable: true })
  headDoctorId: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
