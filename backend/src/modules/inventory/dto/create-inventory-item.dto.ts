import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Перчатки нитриловые M' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'GLV-NIT-M-001' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 'Расходные материалы' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @Min(0)
  @IsOptional()
  minQuantity?: number;

  @ApiProperty({ example: 'шт' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({ example: 15.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expirationDate?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
