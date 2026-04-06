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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExpensesService } from '../services/expenses.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { Expense } from '../entities/expense.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';
import { UserRole } from '../../../common/enums/roles.enum';

@ApiTags('Billing - Expenses')
@Controller('billing/expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create an expense' })
  @ApiResponse({ status: 201, type: Expense })
  create(@Body() dto: CreateExpenseDto): Promise<Expense> {
    return this.expensesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  @ApiResponse({ status: 200 })
  findAll(
    @Query('category') category?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.expensesService.findAll({ category, dateFrom, dateTo, branchId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 200, type: Expense })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Expense> {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update expense' })
  @ApiResponse({ status: 200, type: Expense })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<Expense> {
    return this.expensesService.update(id, dto);
  }

  @Post(':id/approve')
  @Roles(UserRole.OWNER, UserRole.CHIEF_DOCTOR, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Approve expense' })
  @ApiResponse({ status: 200, type: Expense })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Expense> {
    return this.expensesService.approve(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Delete expense' })
  @ApiResponse({ status: 200 })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.expensesService.remove(id);
  }
}
