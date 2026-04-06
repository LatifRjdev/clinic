import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TemplateFieldDto {
  @ApiProperty({ example: 'temperature' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'number' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Body Temperature' })
  @IsString()
  label: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ example: ['normal', 'elevated', 'high'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'General Examination' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'general_practice' })
  @IsString()
  specialty: string;

  @ApiProperty({ type: [TemplateFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateFieldDto)
  fields: TemplateFieldDto[];

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  createdBy: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
