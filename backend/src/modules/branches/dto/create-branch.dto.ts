import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Филиал №1 — Центральный' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'г. Душанбе, пр. Рудаки, 45' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: '+992372234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: {
      monday: { start: '08:00', end: '18:00' },
      tuesday: { start: '08:00', end: '18:00' },
    },
  })
  @IsObject()
  @IsOptional()
  workingHours?: Record<string, { start: string; end: string }>;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isMain?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'branch1@clinic.tj' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
