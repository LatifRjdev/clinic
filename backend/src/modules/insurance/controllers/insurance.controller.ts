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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InsuranceService } from '../services/insurance.service';
import { CreateInsuranceCompanyDto } from '../dto/create-insurance-company.dto';
import { UpdateInsuranceCompanyDto } from '../dto/update-insurance-company.dto';
import { InsuranceCompany } from '../entities/insurance-company.entity';
import { InsuranceRegistry, RegistryStatus } from '../entities/insurance-registry.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';

@ApiTags('Insurance')
@Controller('insurance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // --- Companies ---

  @Post('companies')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create insurance company' })
  @ApiResponse({ status: 201, type: InsuranceCompany })
  createCompany(@Body() dto: CreateInsuranceCompanyDto) {
    return this.insuranceService.createCompany(dto);
  }

  @Get('companies')
  @ApiOperation({ summary: 'List insurance companies' })
  @ApiQuery({ name: 'activeOnly', required: false })
  @ApiResponse({ status: 200, type: [InsuranceCompany] })
  findAllCompanies(@Query('activeOnly') activeOnly?: string) {
    return this.insuranceService.findAllCompanies(activeOnly === 'true');
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get insurance company by ID' })
  @ApiResponse({ status: 200, type: InsuranceCompany })
  findOneCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.insuranceService.findOneCompany(id);
  }

  @Patch('companies/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update insurance company' })
  @ApiResponse({ status: 200, type: InsuranceCompany })
  updateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInsuranceCompanyDto,
  ) {
    return this.insuranceService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Delete insurance company' })
  removeCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.insuranceService.removeCompany(id);
  }

  // --- Registries ---

  @Post('registries')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create insurance registry' })
  @ApiResponse({ status: 201, type: InsuranceRegistry })
  createRegistry(
    @Body() body: { companyId: string; periodStart: Date; periodEnd: Date },
  ) {
    return this.insuranceService.createRegistry(
      body.companyId,
      body.periodStart,
      body.periodEnd,
    );
  }

  @Get('registries')
  @ApiOperation({ summary: 'List registries' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiResponse({ status: 200, type: [InsuranceRegistry] })
  findAllRegistries(@Query('companyId') companyId?: string) {
    return this.insuranceService.findAllRegistries(companyId);
  }

  @Get('registries/:id')
  @ApiOperation({ summary: 'Get registry by ID' })
  findOneRegistry(@Param('id', ParseUUIDPipe) id: string) {
    return this.insuranceService.findOneRegistry(id);
  }

  @Get('registries/:id/reconciliation-act')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Generate reconciliation act (акт сверки) for insurance registry' })
  getRegistryReconciliationAct(@Param('id', ParseUUIDPipe) id: string) {
    return this.insuranceService.generateRegistryReconciliationAct(id);
  }

  @Post('registries/:id/submit')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Submit registry' })
  submitRegistry(@Param('id', ParseUUIDPipe) id: string) {
    return this.insuranceService.submitRegistry(id);
  }

  @Patch('registries/:id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update registry status' })
  updateRegistryStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: RegistryStatus,
  ) {
    return this.insuranceService.updateRegistryStatus(id, status);
  }

  // --- Coverage ---

  @Get('coverage/check')
  @ApiOperation({ summary: 'Check insurance coverage' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'serviceCode', required: true })
  checkCoverage(
    @Query('companyId') companyId: string,
    @Query('serviceCode') serviceCode: string,
  ) {
    return this.insuranceService.checkCoverage(companyId, serviceCode);
  }
}
