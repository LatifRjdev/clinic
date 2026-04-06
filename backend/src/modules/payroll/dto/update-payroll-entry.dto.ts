import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePayrollEntryDto {
  @ApiPropertyOptional({ description: 'Service bonus override' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceBonus?: number;

  @ApiPropertyOptional({ description: 'Deductions amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductions?: number;

  @ApiPropertyOptional({ description: 'Reason for deductions' })
  @IsOptional()
  @IsString()
  deductionReason?: string;
}
