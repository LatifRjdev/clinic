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
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrescriptionsService } from '../services/prescriptions.service';
import { CreatePrescriptionDto } from '../dto/create-prescription.dto';
import { UpdatePrescriptionDto } from '../dto/update-prescription.dto';
import { SearchPrescriptionDto } from '../dto/search-prescription.dto';
import { UserRole } from '../../../common/enums/roles.enum';

@ApiTags('EMR - Prescriptions')
@Controller('emr/prescriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrescriptionsController {
  private readonly bypassRoles = [UserRole.OWNER, UserRole.SYSADMIN, UserRole.CHIEF_DOCTOR, UserRole.ADMIN];

  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new prescription' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list prescriptions with pagination' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchPrescriptionDto) {
    return this.prescriptionsService.findAll(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prescription by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prescription' })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePrescriptionDto,
    @Req() req: { user: { id: string; role: string } },
  ) {
    const userId = this.bypassRoles.includes(req.user.role as UserRole) ? undefined : req.user.id;
    return this.prescriptionsService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a prescription' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string; role: string } },
  ) {
    const userId = this.bypassRoles.includes(req.user.role as UserRole) ? undefined : req.user.id;
    return this.prescriptionsService.remove(id, userId);
  }
}
