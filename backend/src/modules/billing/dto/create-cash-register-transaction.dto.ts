import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CashRegisterTransactionType } from '../entities/cash-register-transaction.entity';

export class CreateCashRegisterTransactionDto {
  @ApiProperty({ enum: CashRegisterTransactionType })
  @IsEnum(CashRegisterTransactionType)
  @IsNotEmpty()
  type: CashRegisterTransactionType;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Размен' })
  @IsString()
  @IsOptional()
  description?: string;
}
