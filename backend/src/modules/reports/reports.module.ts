import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../billing/entities/invoice.entity';
import { Expense } from '../billing/entities/expense.entity';
import { Payment } from '../billing/entities/payment.entity';
import { CashRegister } from '../billing/entities/cash-register.entity';
import { Appointment } from '../scheduling/entities/appointment.entity';
import { User } from '../auth/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { MedicalRecord } from '../emr/entities/medical-record.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Expense, Payment, CashRegister, Appointment, User, Patient, MedicalRecord, InventoryItem])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
