import { IsString, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.APPOINTMENT })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Appointment Reminder' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'You have an appointment tomorrow at 10:00' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: '/appointments/a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({ example: { appointmentId: 'uuid' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
