import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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

export class CreatePromotionDto {
  @ApiProperty({ example: 'Скидка на УЗИ' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional({ example: 'SPRING20' })
  @IsString()
  @IsOptional()
  promoCode?: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serviceIds?: string[];

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  branchId?: string;
}
