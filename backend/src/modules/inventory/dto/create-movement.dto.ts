import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MovementType } from '../entities/inventory-movement.entity';

export class CreateMovementDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ enum: MovementType })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 15.5 })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  performedById: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  fromBranchId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  toBranchId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
