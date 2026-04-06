import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Appointment } from './appointment.entity';
import { Service } from '../../billing/entities/service.entity';

@Entity('appointment_services')
export class AppointmentService extends BaseEntity {
  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => Service, { eager: true })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'recorded_by', type: 'uuid' })
  recordedBy: string;
}
