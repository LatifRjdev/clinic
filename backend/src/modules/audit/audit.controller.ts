import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { SearchAuditDto } from './dto/search-audit.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(UserRole.OWNER, UserRole.CHIEF_DOCTOR)
  @ApiOperation({ summary: 'Search audit logs with filters (OWNER and CHIEF_DOCTOR only)' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchAuditDto) {
    return this.auditService.findAll(searchDto);
  }
}
