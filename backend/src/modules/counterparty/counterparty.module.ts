import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Counterparty } from './entities/counterparty.entity';
import { Expense } from '../billing/entities/expense.entity';
import { CounterpartyService } from './counterparty.service';
import { CounterpartyController } from './counterparty.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Counterparty, Expense])],
  controllers: [CounterpartyController],
  providers: [CounterpartyService],
  exports: [CounterpartyService],
})
export class CounterpartyModule {}
