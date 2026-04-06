import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum DocumentType {
  CONTRACT = 'contract',
  CONSENT = 'consent',
  DISCHARGE = 'discharge',
  CERTIFICATE = 'certificate',
  PRESCRIPTION = 'prescription',
  REFERRAL = 'referral',
  OTHER = 'other',
}

@Entity('documents')
export class Document extends BaseEntity {
  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patientId: string | null;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  @Column({ name: 'template_name', type: 'varchar', nullable: true })
  templateName: string | null;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'mime_type', default: 'application/pdf' })
  mimeType: string;

  @Column({ name: 'file_size', type: 'int', nullable: true })
  fileSize: number | null;

  @Column({ name: 'signed_by', type: 'uuid', nullable: true })
  signedBy: string | null;

  @Column({ name: 'signed_at', type: 'timestamp', nullable: true })
  signedAt: Date | null;
}
