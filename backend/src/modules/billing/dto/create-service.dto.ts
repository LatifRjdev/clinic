import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'General Consultation' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CONS-001' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Initial general consultation with a doctor' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'consultation' })
  @IsString()
  category: string;

  @ApiProperty({ example: 150000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
