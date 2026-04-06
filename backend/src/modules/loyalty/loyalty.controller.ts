import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get(':patientId')
  @Roles(
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTION,
    UserRole.ACCOUNTANT,
    UserRole.CHIEF_DOCTOR,
  )
  @ApiOperation({ summary: 'Get loyalty account for a patient' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.loyaltyService.findByPatient(patientId);
  }

  @Post(':patientId/adjust')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Manually adjust loyalty points (admin only)',
  })
  adjustPoints(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: AdjustPointsDto,
  ) {
    return this.loyaltyService.adjustPoints(patientId, dto.delta);
  }
}
