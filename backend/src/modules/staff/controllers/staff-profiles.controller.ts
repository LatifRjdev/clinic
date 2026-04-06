import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { StaffProfilesService } from '../services/staff-profiles.service';
import { CreateStaffProfileDto } from '../dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from '../dto/update-staff-profile.dto';
import { SearchStaffDto } from '../dto/search-staff.dto';

@ApiTags('Staff - Profiles')
@Controller('staff/profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class StaffProfilesController {
  constructor(private readonly staffProfilesService: StaffProfilesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.SYSADMIN)
  @ApiOperation({ summary: 'Create a new staff profile' })
  @ApiResponse({ status: 201 })
  create(@Body() createStaffProfileDto: CreateStaffProfileDto) {
    return this.staffProfilesService.create(createStaffProfileDto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list staff profiles with pagination' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchStaffDto) {
    return this.staffProfilesService.findAll(searchDto);
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Get a staff profile by user ID' })
  @ApiResponse({ status: 200 })
  getByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.staffProfilesService.getByUserId(userId);
  }

  @Get('by-department/:departmentId')
  @ApiOperation({ summary: 'Get all staff profiles in a department' })
  @ApiResponse({ status: 200 })
  getByDepartment(@Param('departmentId', ParseUUIDPipe) departmentId: string) {
    return this.staffProfilesService.getByDepartment(departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a staff profile by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffProfilesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.SYSADMIN)
  @ApiOperation({ summary: 'Update a staff profile' })
  @ApiResponse({ status: 200 })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStaffProfileDto: UpdateStaffProfileDto,
  ) {
    return this.staffProfilesService.update(id, updateStaffProfileDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.SYSADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a staff profile' })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffProfilesService.remove(id);
  }
}
