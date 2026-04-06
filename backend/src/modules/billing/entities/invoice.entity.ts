import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Payment } from './payment.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Appointment } from '../../scheduling/entities/appointment.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { eager: false })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId: string | null;

  @ManyToOne(() => Appointment, { eager: false, nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment | null;

  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  @Column({ name: 'final_amount', type: 'decimal', precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ name: 'payment_method', type: 'varchar', nullable: true })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;
}
