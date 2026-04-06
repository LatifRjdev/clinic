import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import {
  TestEmailDto,
  TestSmsDto,
  UpdateIntegrationDto,
} from './dto/integration.dto';

@ApiTags('System Integrations')
@Controller('system/integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.SYSADMIN)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all integration configs (secrets masked)' })
  getAll() {
    return this.integrationsService.getAll();
  }

  @Patch(':key')
  @ApiOperation({ summary: 'Update a specific integration config value' })
  update(@Param('key') key: string, @Body() dto: UpdateIntegrationDto) {
    return this.integrationsService.updateOne(key, dto.value);
  }

  @Post('sms/test')
  @ApiOperation({ summary: 'Send a test SMS using current SMS configuration' })
  testSms(@Body() dto: TestSmsDto) {
    return this.integrationsService.testSms(dto.phone, dto.message);
  }

  @Post('smtp/test')
  @ApiOperation({ summary: 'Send a test email using current SMTP configuration' })
  testSmtp(@Body() dto: TestEmailDto) {
    return this.integrationsService.testEmail(dto.to, dto.subject, dto.body);
  }
}
