import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollEntry } from './entities/payroll-entry.entity';
import { PayrollSettings } from './entities/payroll-settings.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { PayrollService } from './services/payroll.service';
import { PayrollController } from './controllers/payroll.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PayrollEntry, PayrollSettings, Invoice])],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
