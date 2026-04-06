import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { PublicService } from './public.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get clinic stats (public)' })
  getStats() {
    return this.publicService.getStats();
  }

  @Get('currency')
  @ApiOperation({ summary: 'Get system default currency (public)' })
  getDefaultCurrency() {
    return this.publicService.getDefaultCurrency();
  }

  @Get('doctors/:id')
  @ApiOperation({ summary: 'Get full doctor profile with schedule and services (public)' })
  getDoctorProfile(@Param('id') id: string) {
    return this.publicService.getDoctorProfile(id);
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Get list of doctors (public)' })
  @ApiQuery({ name: 'specialty', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  getDoctors(
    @Query('specialty') specialty?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.publicService.getDoctors(specialty, branchId);
  }

  @Get('specialties')
  @ApiOperation({ summary: 'Get list of specialties (public)' })
  getSpecialties() {
    return this.publicService.getSpecialties();
  }

  @Get('services')
  @ApiOperation({ summary: 'Get all active services (public)' })
  @ApiQuery({ name: 'category', required: false })
  getServices(@Query('category') category?: string) {
    return this.publicService.getServices(category);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Get available slots for a doctor on a date' })
  @ApiQuery({ name: 'doctorId', required: true })
  @ApiQuery({ name: 'date', required: true })
  getSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    if (!doctorId || !date) throw new BadRequestException('doctorId and date required');
    return this.publicService.getAvailableSlots(doctorId, date);
  }

  @Post('appointments')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Create appointment from public (online booking)' })
  createAppointment(
    @Body() body: {
      doctorId: string;
      date: string;
      startTime: string;
      endTime: string;
      patientFirstName: string;
      patientLastName: string;
      patientPhone: string;
      patientEmail?: string;
      type?: string;
      notes?: string;
    },
  ) {
    return this.publicService.createPublicAppointment(body);
  }
}
