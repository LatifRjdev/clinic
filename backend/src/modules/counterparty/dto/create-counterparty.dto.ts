import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CounterpartyType } from '../entities/counterparty.entity';

export class CreateCounterpartyDto {
  @ApiProperty({ example: 'ООО "МедСнаб"' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CounterpartyType })
  @IsEnum(CounterpartyType)
  type: CounterpartyType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  inn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankAccount?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contractNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
