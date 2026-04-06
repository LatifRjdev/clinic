import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Payment } from './entities/payment.entity';
import { Expense } from './entities/expense.entity';
import { CashRegister } from './entities/cash-register.entity';
import { CashRegisterTransaction } from './entities/cash-register-transaction.entity';
import { ServicesService } from './services/services.service';
import { InvoicesService } from './services/invoices.service';
import { PaymentsService } from './services/payments.service';
import { ExpensesService } from './services/expenses.service';
import { CashRegisterService } from './services/cash-register.service';
import { ServicesController } from './controllers/services.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { PaymentsController } from './controllers/payments.controller';
import { ExpensesController } from './controllers/expenses.controller';
import { CashRegisterController } from './controllers/cash-register.controller';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      Invoice,
      InvoiceItem,
      Payment,
      Expense,
      CashRegister,
      CashRegisterTransaction,
    ]),
    LoyaltyModule,
  ],
  controllers: [
    ServicesController,
    InvoicesController,
    PaymentsController,
    ExpensesController,
    CashRegisterController,
  ],
  providers: [
    ServicesService,
    InvoicesService,
    PaymentsService,
    ExpensesService,
    CashRegisterService,
  ],
  exports: [
    ServicesService,
    InvoicesService,
    PaymentsService,
    ExpensesService,
    CashRegisterService,
  ],
})
export class BillingModule {}
