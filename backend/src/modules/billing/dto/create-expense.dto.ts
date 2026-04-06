import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseCategory } from '../entities/expense.entity';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Закупка перчаток' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1500.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ example: '2026-03-28' })
  @IsDate()
  @Type(() => Date)
  expenseDate: Date;

  @ApiPropertyOptional({ example: 'ООО "МедСнаб"' })
  @IsString()
  @IsOptional()
  paidTo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  createdById: string;
}
