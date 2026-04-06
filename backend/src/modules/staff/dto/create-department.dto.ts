import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Cardiology' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CARDIO' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Department of Cardiology' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  headDoctorId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
