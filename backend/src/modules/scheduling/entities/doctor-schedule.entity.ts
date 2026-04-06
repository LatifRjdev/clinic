import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Room } from './room.entity';

@Entity('doctor_schedules')
export class DoctorSchedule extends BaseEntity {
  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => User, { eager: false, lazy: false })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @Column({ name: 'room_id', type: 'uuid', nullable: true })
  roomId: string | null;

  @ManyToOne(() => Room, { eager: false, lazy: false, nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: Room | null;

  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek: number;

  @Column({ name: 'start_time', type: 'varchar' })
  startTime: string;

  @Column({ name: 'end_time', type: 'varchar' })
  endTime: string;

  @Column({ name: 'break_start', type: 'varchar', nullable: true })
  breakStart: string | null;

  @Column({ name: 'break_end', type: 'varchar', nullable: true })
  breakEnd: string | null;

  @Column({ name: 'slot_duration', type: 'int', default: 30 })
  slotDuration: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;
}
