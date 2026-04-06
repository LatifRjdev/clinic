import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    example: { soundOnNewAppointment: true, autoOpenPatientCard: false },
    description: 'JSONB object with user-specific settings',
  })
  @IsObject()
  settings: Record<string, any>;
}
