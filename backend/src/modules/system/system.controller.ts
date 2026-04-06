import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { LogLevel } from './entities/system-log.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('System Management')
@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.SYSADMIN)
@ApiBearerAuth()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  // --- User Management ---

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin)' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAllUsers(
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.systemService.findAllUsers({
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
      page,
      limit,
    });
  }

  @Post('users/:id/block')
  @ApiOperation({ summary: 'Block user' })
  blockUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.systemService.blockUser(id);
  }

  @Post('users/:id/unblock')
  @ApiOperation({ summary: 'Unblock user' })
  unblockUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.systemService.unblockUser(id);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password (admin)' })
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.systemService.resetUserPassword(id, newPassword);
  }

  // --- System Settings ---

  @Get('settings')
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiQuery({ name: 'category', required: false })
  getAllSettings(@Query('category') category?: string) {
    return this.systemService.getAllSettings(category);
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get setting by key' })
  getSetting(@Param('key') key: string) {
    return this.systemService.getSetting(key);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Create/update a setting' })
  upsertSetting(
    @Body()
    body: {
      key: string;
      value: string;
      category?: string;
      description?: string;
      valueType?: string;
    },
  ) {
    return this.systemService.upsertSetting(
      body.key,
      body.value,
      body.category,
      body.description,
      body.valueType,
    );
  }

  @Delete('settings/:key')
  @ApiOperation({ summary: 'Delete a setting' })
  deleteSetting(@Param('key') key: string) {
    return this.systemService.deleteSetting(key);
  }

  // --- System Logs ---

  @Get('logs')
  @ApiOperation({ summary: 'Get system logs' })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getLogs(
    @Query('level') level?: LogLevel,
    @Query('source') source?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.systemService.getLogs({ level, source, dateFrom, dateTo, page, limit });
  }
}
