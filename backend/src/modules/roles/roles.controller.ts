import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { RolesService } from './roles.service';

@ApiTags('Roles & Permissions')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.SYSADMIN)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @ApiOperation({ summary: 'Get all available permissions' })
  getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Get('defaults')
  @ApiOperation({ summary: 'Get default permissions for built-in roles' })
  getDefaultPermissions() {
    return this.rolesService.getDefaultPermissions();
  }

  @Get()
  @ApiOperation({ summary: 'List all custom roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a custom role by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get permissions for a specific role' })
  getRolePermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.getPermissions(id);
  }

  @Patch(':id/permissions')
  @ApiOperation({ summary: 'Replace the permission set of a role' })
  updateRolePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { permissions: string[] },
  ) {
    return this.rolesService.updatePermissions(id, body?.permissions ?? []);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom role' })
  create(@Body() body: { name: string; description?: string; permissions: string[]; baseRole?: string }) {
    return this.rolesService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a custom role' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<{ name: string; description: string; permissions: string[]; isActive: boolean }>,
  ) {
    return this.rolesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a custom role' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }
}
