import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard data (default)' })
  getDashboardDefault() {
    return this.analyticsService.getDashboard('owner');
  }

  @Get('dashboard/:role')
  @ApiOperation({ summary: 'Get dashboard data for role' })
  getDashboard(@Param('role') role: string) {
    return this.analyticsService.getDashboard(role);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Appointment statistics' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  getAppointmentStats(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.analyticsService.getAppointmentStats(dateFrom, dateTo);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue analytics' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  getRevenueAnalytics(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.analyticsService.getRevenueAnalytics(dateFrom, dateTo);
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Doctor load analytics' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  getDoctorLoad(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.analyticsService.getDoctorLoad(dateFrom, dateTo);
  }

  @Get('patients')
  @ApiOperation({ summary: 'Patient statistics' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  getPatientStats(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.analyticsService.getPatientStats(dateFrom, dateTo);
  }

  @Get('services')
  @ApiOperation({ summary: 'Service popularity analytics' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  getServiceStats(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.analyticsService.getServiceStats(dateFrom, dateTo);
  }

  @Get('satisfaction')
  @ApiOperation({ summary: 'Patient satisfaction / NPS analytics' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  getSatisfaction(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getSatisfaction(dateFrom, dateTo);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Trend analytics (monthly)' })
  @ApiQuery({ name: 'months', required: false })
  getTrends(@Query('months') months?: number) {
    return this.analyticsService.getTrends(months || 12);
  }
}
