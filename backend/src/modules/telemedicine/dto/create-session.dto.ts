import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty()
  @IsUUID()
  appointmentId: string;

  @ApiProperty()
  @IsUUID()
  doctorId: string;

  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomUrl?: string;
}
