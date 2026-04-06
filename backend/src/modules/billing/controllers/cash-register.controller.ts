import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CashRegisterService } from '../services/cash-register.service';
import { CashRegister } from '../entities/cash-register.entity';
import { CashRegisterTransaction } from '../entities/cash-register-transaction.entity';
import { CreateCashRegisterTransactionDto } from '../dto/create-cash-register-transaction.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';

@ApiTags('Billing - Cash Register')
@Controller('billing/cash-register')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('open')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Open cash register' })
  @ApiResponse({ status: 201, type: CashRegister })
  open(
    @CurrentUser() user: User,
    @Body() body: { openingAmount: number; branchId?: string },
  ): Promise<CashRegister> {
    return this.cashRegisterService.open(
      user.id,
      body.openingAmount,
      body.branchId,
    );
  }

  @Post(':id/close')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Close cash register' })
  @ApiResponse({ status: 200, type: CashRegister })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body: { closingAmount: number; notes?: string },
  ): Promise<CashRegister> {
    return this.cashRegisterService.close(
      id,
      user.id,
      body.closingAmount,
      body.notes,
    );
  }

  @Post(':id/encashment')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Record encashment (cash withdrawal)' })
  @ApiResponse({ status: 200, type: CashRegister })
  encashment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('amount') amount: number,
  ): Promise<CashRegister> {
    return this.cashRegisterService.encashment(id, amount);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get currently open cash register' })
  @ApiResponse({ status: 200, type: CashRegister })
  findCurrent(
    @Query('branchId') branchId?: string,
  ): Promise<CashRegister | null> {
    return this.cashRegisterService.findCurrent(branchId);
  }

  @Get()
  @ApiOperation({ summary: 'List cash register sessions' })
  @ApiResponse({ status: 200, type: [CashRegister] })
  findAll(@Query('branchId') branchId?: string): Promise<CashRegister[]> {
    return this.cashRegisterService.findAll(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cash register by ID' })
  @ApiResponse({ status: 200, type: CashRegister })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CashRegister> {
    return this.cashRegisterService.findOne(id);
  }

  @Post(':id/transaction')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Add cash-in/cash-out transaction' })
  @ApiResponse({ status: 201, type: CashRegisterTransaction })
  addTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCashRegisterTransactionDto,
  ): Promise<CashRegisterTransaction> {
    return this.cashRegisterService.addTransaction(id, dto, user.id);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get transactions for a cash register' })
  @ApiResponse({ status: 200, type: [CashRegisterTransaction] })
  getTransactions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CashRegisterTransaction[]> {
    return this.cashRegisterService.getTransactions(id);
  }
}
