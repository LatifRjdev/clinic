import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralPriority, ReferralStatus } from '../entities/referral.entity';

export class CreateReferralDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  referringDoctorId: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsOptional()
  @IsUUID()
  targetDoctorId?: string;

  @ApiProperty({ example: 'cardiology' })
  @IsString()
  targetSpecialty: string;

  @ApiPropertyOptional({ example: 'd4e5f6a7-b8c9-0123-defa-234567890123' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiProperty({ example: 'Suspected cardiac arrhythmia, needs ECG evaluation' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'Patient has family history of heart disease' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: ReferralPriority, default: ReferralPriority.ROUTINE })
  @IsOptional()
  @IsEnum(ReferralPriority)
  priority?: ReferralPriority;

  @ApiPropertyOptional({ enum: ReferralStatus, default: ReferralStatus.CREATED })
  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;

  @ApiPropertyOptional({ example: 'e5f6a7b8-c9d0-1234-efab-345678901234', description: 'Target branch for inter-branch referrals' })
  @IsOptional()
  @IsUUID()
  targetBranchId?: string;

  @ApiPropertyOptional({ default: false, description: 'Whether this is an inter-branch referral' })
  @IsOptional()
  @IsBoolean()
  isInterBranch?: boolean;
}
