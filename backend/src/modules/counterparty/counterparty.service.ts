import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Counterparty } from './entities/counterparty.entity';
import { Expense } from '../billing/entities/expense.entity';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';

@Injectable()
export class CounterpartyService {
  constructor(
    @InjectRepository(Counterparty)
    private readonly counterpartyRepository: Repository<Counterparty>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(dto: CreateCounterpartyDto): Promise<Counterparty> {
    const entity = this.counterpartyRepository.create(dto);
    return this.counterpartyRepository.save(entity);
  }

  async findAll(type?: string): Promise<Counterparty[]> {
    const qb = this.counterpartyRepository.createQueryBuilder('c');
    if (type) qb.where('c.type = :type', { type });
    return qb.orderBy('c.name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Counterparty> {
    const entity = await this.counterpartyRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Counterparty #${id} not found`);
    return entity;
  }

  async update(id: string, dto: UpdateCounterpartyDto): Promise<Counterparty> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.counterpartyRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.counterpartyRepository.softRemove(entity);
  }

  /**
   * Generate a reconciliation act (акт сверки) for a counterparty over a period.
   * Matches expenses by counterparty name via the `paid_to` field (best-effort,
   * until an explicit FK between expenses and counterparties is introduced).
   */
  async generateReconciliationAct(
    id: string,
    from?: string,
    to?: string,
  ): Promise<{
    actNumber: string;
    actDate: string;
    period: { from: string; to: string };
    counterparty: {
      id: string;
      name: string;
      type: string;
      inn: string | null;
      address: string | null;
      contractNumber: string | null;
      bankAccount: string | null;
    };
    lines: Array<{
      date: string;
      description: string;
      debit: number; // our obligation to counterparty (e.g. supplier invoice)
      credit: number; // what we paid to counterparty
      category: string;
    }>;
    totals: {
      openingBalance: number;
      totalDebit: number;
      totalCredit: number;
      closingBalance: number;
    };
  }> {
    const counterparty = await this.findOne(id);

    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), 0, 1);
    const periodFrom = from ? new Date(from) : defaultFrom;
    const periodTo = to ? new Date(to) : today;

    const expenses = await this.expenseRepository.find({
      where: {
        paidTo: counterparty.name,
        expenseDate: Between(
          periodFrom.toISOString().slice(0, 10) as unknown as Date,
          periodTo.toISOString().slice(0, 10) as unknown as Date,
        ),
      },
      order: { expenseDate: 'ASC' },
    });

    const lines = expenses.map((e) => ({
      date: (e.expenseDate instanceof Date
        ? e.expenseDate
        : new Date(e.expenseDate)
      )
        .toISOString()
        .slice(0, 10),
      description: e.description,
      // Expenses in our ledger are outflows: counterparty supplied goods/services
      // (debit side for us) and we paid for them (credit side).
      debit: Number(e.amount) || 0,
      credit: e.isApproved ? Number(e.amount) || 0 : 0,
      category: e.category,
    }));

    const totalDebit = +lines.reduce((s, l) => s + l.debit, 0).toFixed(2);
    const totalCredit = +lines.reduce((s, l) => s + l.credit, 0).toFixed(2);
    const openingBalance = 0; // requires historical ledger, not tracked yet
    const closingBalance = +(openingBalance + totalDebit - totalCredit).toFixed(2);

    return {
      actNumber: `ACT-CP-${counterparty.id.slice(0, 8)}-${today.toISOString().slice(0, 10)}`,
      actDate: today.toISOString().slice(0, 10),
      period: {
        from: periodFrom.toISOString().slice(0, 10),
        to: periodTo.toISOString().slice(0, 10),
      },
      counterparty: {
        id: counterparty.id,
        name: counterparty.name,
        type: counterparty.type,
        inn: counterparty.inn,
        address: counterparty.address,
        contractNumber: counterparty.contractNumber,
        bankAccount: counterparty.bankAccount,
      },
      lines,
      totals: {
        openingBalance,
        totalDebit,
        totalCredit,
        closingBalance,
      },
    };
  }
}
