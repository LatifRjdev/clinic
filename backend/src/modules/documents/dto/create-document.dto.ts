import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../entities/document.entity';

export class CreateDocumentDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'Consent Form' })
  @IsString()
  title: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.CONSENT })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiPropertyOptional({ example: 'consent_template_v1' })
  @IsOptional()
  @IsString()
  templateName?: string;

  @ApiProperty({ example: '/documents/2026/03/consent-form.pdf' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 102400 })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  signedBy?: string;

  @ApiPropertyOptional({ example: '2026-03-27T10:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  signedAt?: Date;
}
