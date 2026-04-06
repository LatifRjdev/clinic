import {
  IsString,
  IsOptional,
  IsDate,
  IsEnum,
  IsBoolean,
  IsEmail,
  IsArray,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../entities/patient.entity';

export class CreatePatientDto {
  @ApiPropertyOptional({ example: 'MRN-20260405-0001', description: 'Auto-generated if not provided' })
  @IsOptional()
  @IsString()
  medicalRecordNumber?: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'Michael' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: '1990-05-15' })
  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '+992901234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+992\d{9}$/, {
    message: 'Телефон должен быть в формате +992XXXXXXXXX (12 цифр)',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'г. Душанбе, ул. Рудаки, 45' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'AB1234567' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9]{6,15}$/, {
    message: 'Номер паспорта должен содержать 6-15 буквенно-цифровых символов',
  })
  passportNumber?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ example: 'A+' })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiPropertyOptional({ example: 'Penicillin, Peanuts' })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional({ example: ['VIP'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Referral' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'Prefers morning appointments' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  consentDate?: Date;

  @ApiPropertyOptional({ example: 'ОМС-1234567890' })
  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  insuranceCompanyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;
}
