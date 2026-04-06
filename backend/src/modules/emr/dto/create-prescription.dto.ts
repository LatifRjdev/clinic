import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrescriptionDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsUUID()
  medicalRecordId: string;

  @ApiProperty({ example: 'Amoxicillin' })
  @IsString()
  medicationName: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  dosage: string;

  @ApiProperty({ example: '3 times a day' })
  @IsString()
  frequency: string;

  @ApiPropertyOptional({ example: '7 days' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 'Take after meals with plenty of water' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
