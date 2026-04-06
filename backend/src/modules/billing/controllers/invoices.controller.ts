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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvoicesService } from '../services/invoices.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { SearchInvoiceDto } from '../dto/search-invoice.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';

@ApiTags('Billing - Invoices')
@Controller('billing/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list invoices with pagination' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchInvoiceDto) {
    return this.invoicesService.findAll(searchDto);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue invoices' })
  @ApiResponse({ status: 200 })
  findOverdue(@Query('branchId') branchId?: string) {
    return this.invoicesService.findOverdue(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID with items and payments' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiResponse({ status: 200 })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, dto);
  }

  @Post(':id/pay')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an invoice as fully paid' })
  @ApiResponse({ status: 200 })
  markAsPaid(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.markAsPaid(id);
  }

  @Post(':id/refund')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a paid invoice' })
  @ApiResponse({ status: 200 })
  refund(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.refund(id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete an invoice' })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.remove(id);
  }
}
