import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateStaffProfileDto } from './create-staff-profile.dto';

export class UpdateStaffProfileDto extends PartialType(
  OmitType(CreateStaffProfileDto, ['userId'] as const),
) {}
