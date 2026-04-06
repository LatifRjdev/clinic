import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { SearchPaymentDto } from '../dto/search-payment.dto';

@ApiTags('Billing - Payments')
@Controller('billing/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create a new payment for an invoice' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list payments with pagination' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchPaymentDto) {
    return this.paymentsService.findAll(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a payment' })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
