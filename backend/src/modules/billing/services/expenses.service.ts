import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expenseRepository.create(dto);
    return this.expenseRepository.save(expense);
  }

  async findAll(params?: {
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    branchId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Expense[]; total: number }> {
    const { category, dateFrom, dateTo, branchId, page = 1, limit = 20 } = params || {};

    const qb = this.expenseRepository.createQueryBuilder('expense');

    if (category) {
      qb.andWhere('expense.category = :category', { category });
    }
    if (dateFrom) {
      qb.andWhere('expense.expense_date >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      qb.andWhere('expense.expense_date <= :dateTo', { dateTo });
    }
    if (branchId) {
      qb.andWhere('expense.branch_id = :branchId', { branchId });
    }

    qb.orderBy('expense.expense_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense #${id} not found`);
    }
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id);
    Object.assign(expense, dto);
    return this.expenseRepository.save(expense);
  }

  async approve(id: string, approvedById: string): Promise<Expense> {
    const expense = await this.findOne(id);
    expense.isApproved = true;
    expense.approvedById = approvedById;
    return this.expenseRepository.save(expense);
  }

  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);
    await this.expenseRepository.softRemove(expense);
  }
}
