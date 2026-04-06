import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ArrayNotEmpty,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../entities/appointment.entity';

export class BulkCancelAppointmentsDto {
  @ApiProperty({ type: [String], description: 'IDs of appointments to cancel' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  appointmentIds: string[];

  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkRescheduleAppointmentsDto {
  @ApiProperty({ type: [String], description: 'IDs of appointments to reschedule' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  appointmentIds: string[];

  @ApiProperty({ example: '2026-04-01', description: 'New date (ISO format)' })
  @IsDateString()
  @IsNotEmpty()
  newDate: string;
}

export class BulkChangeAppointmentStatusDto {
  @ApiProperty({ type: [String], description: 'IDs of appointments' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  appointmentIds: string[];

  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
