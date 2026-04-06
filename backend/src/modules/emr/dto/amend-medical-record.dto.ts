import { IsString, IsOptional, IsObject, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AmendMedicalRecordDto {
  @ApiProperty({ example: 'Correcting diagnosis based on lab results' })
  @IsString()
  @MinLength(3)
  reason: string;

  @ApiPropertyOptional({ example: 'Updated complaints text' })
  @IsOptional()
  @IsString()
  complaints?: string;

  @ApiPropertyOptional({ example: 'Updated anamnesis text' })
  @IsOptional()
  @IsString()
  anamnesis?: string;

  @ApiPropertyOptional({ example: 'Updated examination text' })
  @IsOptional()
  @IsString()
  examination?: string;

  @ApiPropertyOptional({ example: 'Updated diagnosis' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'J06.0' })
  @IsOptional()
  @IsString()
  diagnosisCode?: string;

  @ApiPropertyOptional({ example: 'Updated recommendations' })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: { temperature: '37.5' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
