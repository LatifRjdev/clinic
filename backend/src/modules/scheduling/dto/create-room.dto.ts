import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'Examination Room 1' })
  @IsString()
  name: string;

  @ApiProperty({ example: '101' })
  @IsString()
  number: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  floor: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'General examination room with ultrasound' })
  @IsOptional()
  @IsString()
  description?: string;
}
