import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PayrollService } from '../services/payroll.service';
import { PayrollEntry, PayrollStatus } from '../entities/payroll-entry.entity';
import { PayrollSettings } from '../entities/payroll-settings.entity';
import { UpdatePayrollEntryDto } from '../dto/update-payroll-entry.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';
import { UserRole } from '../../../common/enums/roles.enum';

@ApiTags('Payroll')
@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // --- Settings ---

  @Get('settings/:employeeId')
  @ApiOperation({ summary: 'Get payroll settings for employee' })
  getSettings(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.payrollService.getSettings(employeeId);
  }

  @Patch('settings/:employeeId')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create/update payroll settings' })
  upsertSettings(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() data: Partial<PayrollSettings>,
  ) {
    return this.payrollService.upsertSettings(employeeId, data);
  }

  // --- Entries ---

  @Post('calculate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Calculate payroll for an employee' })
  @ApiResponse({ status: 201, type: PayrollEntry })
  calculate(
    @Body() body: { employeeId: string; year: number; month: number },
  ) {
    return this.payrollService.calculate(body.employeeId, body.year, body.month);
  }

  @Get()
  @ApiOperation({ summary: 'List payroll entries' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('status') status?: PayrollStatus,
    @Query('branchId') branchId?: string,
  ) {
    return this.payrollService.findAll({ year, month, status, branchId });
  }

  @Get('sheet')
  @ApiOperation({ summary: 'Get payroll sheet for a month' })
  @ApiQuery({ name: 'year', required: true })
  @ApiQuery({ name: 'month', required: true })
  getSheet(@Query('year') year: number, @Query('month') month: number) {
    return this.payrollService.getSheet(year, month);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payroll entry by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.payrollService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update payroll entry (bonus/deductions)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayrollEntryDto,
  ) {
    return this.payrollService.update(id, dto);
  }

  @Post(':id/approve')
  @Roles(UserRole.OWNER, UserRole.CHIEF_DOCTOR)
  @ApiOperation({ summary: 'Approve payroll entry' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.payrollService.approve(id, user.id);
  }

  @Post(':id/pay')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Mark payroll as paid' })
  markPaid(@Param('id', ParseUUIDPipe) id: string) {
    return this.payrollService.markPaid(id);
  }
}
