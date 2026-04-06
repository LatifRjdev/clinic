import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateIntegrationDto {
  @ApiProperty({ description: 'Integration value (string, number or JSON serialized)' })
  @IsString()
  value: string;
}

export class TestSmsDto {
  @ApiProperty({ example: '+992900000000' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'Test SMS from MedClinic' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class TestEmailDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsString()
  to: string;

  @ApiPropertyOptional({ example: 'Test email from MedClinic' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;
}

export interface IntegrationConfigItem {
  key: string;
  value: string | null;
  masked: boolean;
  category: string;
  description?: string | null;
}
