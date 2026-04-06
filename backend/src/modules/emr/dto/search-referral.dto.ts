import { IsOptional, IsString, IsInt, Min, IsIn, IsUUID, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralPriority, ReferralStatus } from '../entities/referral.entity';

export class SearchReferralDto {
  @ApiPropertyOptional({ description: 'Filter by patient ID' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Filter by referring doctor ID' })
  @IsOptional()
  @IsUUID()
  referringDoctorId?: string;

  @ApiPropertyOptional({ description: 'Filter by target doctor ID' })
  @IsOptional()
  @IsUUID()
  targetDoctorId?: string;

  @ApiPropertyOptional({ enum: ReferralStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;

  @ApiPropertyOptional({ enum: ReferralPriority, description: 'Filter by priority' })
  @IsOptional()
  @IsEnum(ReferralPriority)
  priority?: ReferralPriority;

  @ApiPropertyOptional({ description: 'Filter from date', example: '2025-01-01' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter to date', example: '2025-12-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'createdAt', description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ default: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
