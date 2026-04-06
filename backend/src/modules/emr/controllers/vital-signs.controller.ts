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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { VitalSignsService } from '../services/vital-signs.service';
import { CreateVitalSignsDto } from '../dto/create-vital-signs.dto';
import { UpdateVitalSignsDto } from '../dto/update-vital-signs.dto';
import { VitalSigns } from '../entities/vital-signs.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('EMR - Vital Signs')
@Controller('emr/vitals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VitalSignsController {
  constructor(private readonly vitalSignsService: VitalSignsService) {}

  @Post()
  @ApiOperation({ summary: 'Record vital signs' })
  @ApiResponse({ status: 201, type: VitalSigns })
  create(@Body() dto: CreateVitalSignsDto): Promise<VitalSigns> {
    return this.vitalSignsService.create(dto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get vital signs for a patient' })
  @ApiResponse({ status: 200, type: [VitalSigns] })
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<VitalSigns[]> {
    return this.vitalSignsService.findByPatient(patientId);
  }

  @Get('patient/:patientId/chart')
  @ApiOperation({ summary: 'Get vital signs chart data' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  @ApiResponse({ status: 200, type: [VitalSigns] })
  getChartData(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('days') days?: number,
  ): Promise<VitalSigns[]> {
    return this.vitalSignsService.getChartData(patientId, days || 30);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vital signs by ID' })
  @ApiResponse({ status: 200, type: VitalSigns })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<VitalSigns> {
    return this.vitalSignsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vital signs' })
  @ApiResponse({ status: 200, type: VitalSigns })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVitalSignsDto,
  ): Promise<VitalSigns> {
    return this.vitalSignsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vital signs' })
  @ApiResponse({ status: 200 })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.vitalSignsService.remove(id);
  }
}
