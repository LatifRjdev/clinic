import { IsString, IsOptional, IsUUID, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalaryType } from '../entities/staff-profile.entity';

export class CreateStaffProfileDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'Кардиолог' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ example: 'LIC-2026-001' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'Tashkent Medical Academy, 2015' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ example: '10 years in cardiology' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ example: 'Experienced cardiologist specializing in...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ enum: SalaryType, example: SalaryType.FIXED })
  @IsEnum(SalaryType)
  salaryType: SalaryType;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  salaryAmount?: number;

  @ApiPropertyOptional({ example: 15.5 })
  @IsOptional()
  @IsNumber()
  salaryPercentage?: number;
}
