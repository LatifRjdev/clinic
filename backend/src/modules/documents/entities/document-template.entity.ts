import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DocumentType } from './document.entity';

@Entity('document_templates')
export class DocumentTemplate extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  variables: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
