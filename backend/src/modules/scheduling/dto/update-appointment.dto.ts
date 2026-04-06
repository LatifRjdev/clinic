import { IsString, IsOptional, IsEnum } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../entities/appointment.entity';
import { CreateAppointmentDto } from './create-appointment.dto';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @ApiPropertyOptional({
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ example: 'Patient requested reschedule' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
