import { PartialType } from '@nestjs/swagger';
import { CreateVitalSignsDto } from './create-vital-signs.dto';

export class UpdateVitalSignsDto extends PartialType(CreateVitalSignsDto) {}
