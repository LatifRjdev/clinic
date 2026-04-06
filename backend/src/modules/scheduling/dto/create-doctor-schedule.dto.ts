import {
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDoctorScheduleDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  doctorId: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiProperty({ example: 1, description: '0 = Sunday, 6 = Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({ example: '13:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'breakStart must be in HH:mm format' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'breakEnd must be in HH:mm format' })
  breakEnd?: string;

  @ApiPropertyOptional({ example: 30, description: 'Slot duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  slotDuration?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
