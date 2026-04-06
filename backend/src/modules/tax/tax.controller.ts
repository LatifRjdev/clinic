import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TaxService } from './tax.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Tax')
@Controller('tax')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('calendar')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Get Tajikistan tax calendar for the given year' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getCalendar(@Query('year') year?: string) {
    const parsed = year ? parseInt(year, 10) : undefined;
    return this.taxService.getCalendar(Number.isFinite(parsed) ? parsed : undefined);
  }

  @Get('rates')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Get Tajikistan tax rates reference' })
  getRates() {
    return this.taxService.getRates();
  }

  @Get('calculate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Calculate tax for a given amount and type' })
  @ApiQuery({ name: 'type', required: true, description: 'vat | income | social | property | simplified' })
  @ApiQuery({ name: 'amount', required: true, type: Number })
  calculate(@Query('type') type: string, @Query('amount') amount: string) {
    return this.taxService.calculate(type, Number(amount));
  }
}
