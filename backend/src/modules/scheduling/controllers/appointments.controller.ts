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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentsService } from '../services/appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { SearchAppointmentsDto } from '../dto/search-appointments.dto';
import {
  BulkCancelAppointmentsDto,
  BulkRescheduleAppointmentsDto,
  BulkChangeAppointmentStatusDto,
} from '../dto/bulk-appointments.dto';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';

@ApiTags('Scheduling - Appointments')
@Controller('scheduling/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, type: Appointment })
  create(@Body() dto: CreateAppointmentDto): Promise<Appointment> {
    return this.appointmentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search appointments with filters and pagination' })
  @ApiResponse({ status: 200 })
  findAll(
    @Query() query: SearchAppointmentsDto,
  ): Promise<{ data: Appointment[]; total: number }> {
    return this.appointmentsService.findAll(query);
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Get list of doctors (accessible to all authenticated users)' })
  @ApiResponse({ status: 200 })
  getDoctors() {
    return this.appointmentsService.getDoctors();
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s appointments' })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, type: [Appointment] })
  findToday(
    @Query('doctorId') doctorId?: string,
    @Query('branchId') branchId?: string,
  ): Promise<Appointment[]> {
    return this.appointmentsService.findToday(doctorId, branchId);
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'Check for scheduling conflicts' })
  @ApiQuery({ name: 'doctorId', required: true })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'startTime', required: true })
  @ApiQuery({ name: 'endTime', required: true })
  @ApiResponse({ status: 200, type: [Appointment] })
  findConflicts(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ): Promise<Appointment[]> {
    return this.appointmentsService.findConflicts(
      doctorId,
      date,
      startTime,
      endTime,
    );
  }

  @Post('bulk/cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.CHIEF_DOCTOR, UserRole.RECEPTION)
  @ApiOperation({ summary: 'Bulk cancel appointments' })
  @ApiResponse({ status: 200 })
  bulkCancel(@Body() dto: BulkCancelAppointmentsDto) {
    return this.appointmentsService.bulkCancel(dto.appointmentIds, dto.reason);
  }

  @Post('bulk/reschedule')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.CHIEF_DOCTOR, UserRole.RECEPTION)
  @ApiOperation({ summary: 'Bulk reschedule appointments to a new date' })
  @ApiResponse({ status: 200 })
  bulkReschedule(@Body() dto: BulkRescheduleAppointmentsDto) {
    return this.appointmentsService.bulkReschedule(dto.appointmentIds, dto.newDate);
  }

  @Post('bulk/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.CHIEF_DOCTOR, UserRole.RECEPTION)
  @ApiOperation({ summary: 'Bulk change appointment status' })
  @ApiResponse({ status: 200 })
  bulkChangeStatus(@Body() dto: BulkChangeAppointmentStatusDto) {
    return this.appointmentsService.bulkChangeStatus(
      dto.appointmentIds,
      dto.status as AppointmentStatus,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by id' })
  @ApiResponse({ status: 200, type: Appointment })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Appointment> {
    return this.appointmentsService.findOne(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm an appointment' })
  @ApiResponse({ status: 200, type: Appointment })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Appointment> {
    return this.appointmentsService.confirm(id);
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule an appointment' })
  @ApiResponse({ status: 200, type: Appointment })
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { date: Date; startTime: string; endTime: string },
  ): Promise<Appointment> {
    return this.appointmentsService.reschedule(
      id,
      body.date,
      body.startTime,
      body.endTime,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change appointment status' })
  @ApiResponse({ status: 200, type: Appointment })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: AppointmentStatus; cancellationReason?: string },
  ): Promise<Appointment> {
    return this.appointmentsService.changeStatus(
      id,
      body.status,
      body.cancellationReason,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiResponse({ status: 200, type: Appointment })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an appointment' })
  @ApiResponse({ status: 200 })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.appointmentsService.remove(id);
  }

  @Post(':id/services')
  @ApiOperation({ summary: 'Add rendered services to an appointment' })
  @ApiResponse({ status: 201 })
  addServices(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { items: { serviceId: string; quantity: number; notes?: string }[]; recordedBy: string },
  ) {
    return this.appointmentsService.addServices(id, body.items, body.recordedBy);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Get rendered services for an appointment' })
  @ApiResponse({ status: 200 })
  getServices(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.getServices(id);
  }

  @Delete(':id/services/:serviceRecordId')
  @ApiOperation({ summary: 'Remove a rendered service from appointment' })
  @ApiResponse({ status: 200 })
  removeService(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('serviceRecordId', ParseUUIDPipe) serviceRecordId: string,
  ) {
    return this.appointmentsService.removeService(id, serviceRecordId);
  }
}
