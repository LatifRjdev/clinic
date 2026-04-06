import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { CustomReportDto } from './dto/custom-report.dto';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.CHIEF_DOCTOR, UserRole.ACCOUNTANT, UserRole.ADMIN)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue report' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  getRevenue(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getRevenue(dateFrom, dateTo, branchId);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Expenses report by category' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  getExpenses(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getExpenses(dateFrom, dateTo, branchId);
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Profit & Loss report' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  getProfitLoss(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getProfitLoss(dateFrom, dateTo, branchId);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Cash flow report (monthly income/outflow)' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  getCashFlow(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getCashFlow(dateFrom, dateTo, branchId);
  }

  @Get('services')
  @ApiOperation({ summary: 'Revenue by services' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  getByServices(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.reportsService.getRevenueByServices(dateFrom, dateTo);
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Revenue by doctors' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  getByDoctors(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.reportsService.getRevenueByDoctors(dateFrom, dateTo);
  }

  @Get('tax')
  @ApiOperation({ summary: 'Tax report (quarterly)' })
  @ApiQuery({ name: 'year', required: true })
  getTaxReport(@Query('year') year: number) {
    return this.reportsService.getTaxReport(year);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Report by departments (specialties)' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  getDepartments(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.reportsService.getDepartments(dateFrom, dateTo);
  }

  @Get('daily-cashier')
  @ApiOperation({ summary: 'Daily cashier report (invoices, payments, refunds, sessions)' })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'branchId', required: false })
  getDailyCashierReport(
    @Query('date') date: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getDailyCashierReport(date, branchId);
  }

  @Get('monthly-accounting')
  @ApiOperation({ summary: 'Monthly accounting report (revenue, expenses, profit, breakdowns)' })
  @ApiQuery({ name: 'year', required: true })
  @ApiQuery({ name: 'month', required: true, description: '1-12' })
  @ApiQuery({ name: 'branchId', required: false })
  getMonthlyAccountingReport(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getMonthlyAccountingReport(
      Number(year),
      Number(month),
      branchId,
    );
  }

  @Get('doctor-workload')
  @ApiOperation({ summary: 'Doctor workload report (appointments, hours, revenue, patients)' })
  @ApiQuery({ name: 'from', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'branchId', required: false })
  getDoctorWorkloadReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getDoctorWorkloadReport(from, to, branchId);
  }

  @Post('custom')
  @ApiOperation({ summary: 'Generate a custom report based on selected data source, columns, filters and grouping' })
  getCustomReport(@Body() dto: CustomReportDto) {
    return this.reportsService.getCustomReport(dto);
  }
}
