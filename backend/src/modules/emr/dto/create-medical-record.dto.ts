import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicalRecordStatus } from '../entities/medical-record.entity';

export class CreateMedicalRecordDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  doctorId: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiProperty({ example: 'Headache, fever for 3 days' })
  @IsString()
  complaints: string;

  @ApiProperty({ example: 'Patient reports onset 3 days ago after exposure to cold' })
  @IsString()
  anamnesis: string;

  @ApiProperty({ example: 'Temperature 38.2C, throat redness observed' })
  @IsString()
  examination: string;

  @ApiProperty({ example: 'Acute upper respiratory infection' })
  @IsString()
  diagnosis: string;

  @ApiPropertyOptional({ example: 'J06.9' })
  @IsOptional()
  @IsString()
  diagnosisCode?: string;

  @ApiPropertyOptional({ example: 'Rest, fluids, follow-up in 5 days' })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional({ example: 'Patient has history of chronic bronchitis' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'd4e5f6a7-b8c9-0123-defa-234567890123' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ example: { temperature: '38.2', bloodPressure: '120/80' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ enum: MedicalRecordStatus, default: MedicalRecordStatus.DRAFT })
  @IsOptional()
  @IsEnum(MedicalRecordStatus)
  status?: MedicalRecordStatus;
}
