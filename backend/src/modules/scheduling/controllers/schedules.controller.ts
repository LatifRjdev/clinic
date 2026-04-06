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
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import {
  SchedulesService,
  TimeSlot,
} from '../services/schedules.service';
import { CreateDoctorScheduleDto } from '../dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from '../dto/update-doctor-schedule.dto';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';

@ApiTags('Scheduling - Doctor Schedules')
@Controller('scheduling/schedules')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a doctor schedule' })
  @ApiResponse({
    status: 201,
    description: 'Schedule created',
    type: DoctorSchedule,
  })
  create(@Body() dto: CreateDoctorScheduleDto): Promise<DoctorSchedule> {
    return this.schedulesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all doctor schedules' })
  @ApiResponse({
    status: 200,
    description: 'List of schedules',
    type: [DoctorSchedule],
  })
  findAll(@Query('branchId') branchId?: string): Promise<DoctorSchedule[]> {
    return this.schedulesService.findAll(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor schedule by id' })
  @ApiResponse({
    status: 200,
    description: 'Schedule details',
    type: DoctorSchedule,
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DoctorSchedule> {
    return this.schedulesService.findOne(id);
  }

  @Get(':doctorId/slots')
  @ApiOperation({
    summary: 'Get available time slots for a doctor on a given date',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    example: '2026-04-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Available time slots',
  })
  getAvailableSlots(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date: string,
  ): Promise<TimeSlot[]> {
    return this.schedulesService.getAvailableSlots(
      doctorId,
      new Date(date),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a doctor schedule' })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated',
    type: DoctorSchedule,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDoctorScheduleDto,
  ): Promise<DoctorSchedule> {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a doctor schedule' })
  @ApiResponse({ status: 200, description: 'Schedule deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.schedulesService.remove(id);
  }
}
