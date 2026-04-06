import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateVitalSignsDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsInt()
  @Min(50)
  @Max(300)
  @IsOptional()
  systolicBp?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsInt()
  @Min(30)
  @Max(200)
  @IsOptional()
  diastolicBp?: number;

  @ApiPropertyOptional({ example: 72 })
  @IsInt()
  @Min(30)
  @Max(250)
  @IsOptional()
  heartRate?: number;

  @ApiPropertyOptional({ example: 36.6 })
  @IsNumber()
  @Min(34)
  @Max(43)
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ example: 16 })
  @IsInt()
  @Min(5)
  @Max(60)
  @IsOptional()
  respiratoryRate?: number;

  @ApiPropertyOptional({ example: 98 })
  @IsInt()
  @Min(50)
  @Max(100)
  @IsOptional()
  spo2?: number;

  @ApiPropertyOptional({ example: 75.5 })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ example: 175.0 })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ example: 5.5 })
  @IsNumber()
  @IsOptional()
  glucose?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
