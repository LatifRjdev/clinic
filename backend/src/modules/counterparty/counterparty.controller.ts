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
import { CounterpartyService } from './counterparty.service';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';
import { Counterparty } from './entities/counterparty.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Counterparties')
@Controller('counterparties')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CounterpartyController {
  constructor(private readonly counterpartyService: CounterpartyService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create counterparty' })
  @ApiResponse({ status: 201, type: Counterparty })
  create(@Body() dto: CreateCounterpartyDto) {
    return this.counterpartyService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List counterparties' })
  @ApiQuery({ name: 'type', required: false })
  @ApiResponse({ status: 200, type: [Counterparty] })
  findAll(@Query('type') type?: string) {
    return this.counterpartyService.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get counterparty by ID' })
  @ApiResponse({ status: 200, type: Counterparty })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.counterpartyService.findOne(id);
  }

  @Get(':id/reconciliation-act')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Generate reconciliation act (акт сверки) for counterparty' })
  @ApiQuery({ name: 'from', required: false, description: 'Period start (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'Period end (YYYY-MM-DD)' })
  getReconciliationAct(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.counterpartyService.generateReconciliationAct(id, from, to);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update counterparty' })
  @ApiResponse({ status: 200, type: Counterparty })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCounterpartyDto,
  ) {
    return this.counterpartyService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Delete counterparty' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.counterpartyService.remove(id);
  }
}
