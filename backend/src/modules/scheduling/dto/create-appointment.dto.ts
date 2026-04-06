import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDate,
  Matches,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AppointmentType,
  AppointmentSource,
  AppointmentStatus,
} from '../entities/appointment.entity';

@ValidatorConstraint({ name: 'isEndTimeAfterStart', async: false })
class IsEndTimeAfterStart implements ValidatorConstraintInterface {
  validate(endTime: string, args: ValidationArguments) {
    const dto = args.object as CreateAppointmentDto;
    if (!dto.startTime || !endTime) return true;
    return endTime > dto.startTime;
  }
  defaultMessage() {
    return 'endTime должен быть позже startTime';
  }
}

export class CreateAppointmentDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  doctorId: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ example: '09:30' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  @Validate(IsEndTimeAfterStart)
  endTime: string;

  @ApiProperty({ enum: AppointmentType, example: AppointmentType.PRIMARY })
  @IsEnum(AppointmentType)
  type: AppointmentType;

  @ApiPropertyOptional({ example: 'Patient complains of headache' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({
    enum: AppointmentSource,
    example: AppointmentSource.RECEPTION,
  })
  @IsOptional()
  @IsEnum(AppointmentSource)
  source?: AppointmentSource;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
