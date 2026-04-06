import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegister, CashRegisterStatus } from '../entities/cash-register.entity';
import { CashRegisterTransaction, CashRegisterTransactionType } from '../entities/cash-register-transaction.entity';
import { CreateCashRegisterTransactionDto } from '../dto/create-cash-register-transaction.dto';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(CashRegisterTransaction)
    private readonly transactionRepository: Repository<CashRegisterTransaction>,
  ) {}

  async open(
    openedById: string,
    openingAmount: number,
    branchId?: string,
  ): Promise<CashRegister> {
    // Check if there's already an open register for this branch
    const existing = await this.cashRegisterRepository.findOne({
      where: {
        status: CashRegisterStatus.OPEN,
        ...(branchId ? { branchId } : {}),
      },
    });

    if (existing) {
      throw new BadRequestException('A cash register is already open');
    }

    const register = this.cashRegisterRepository.create({
      openedById,
      openingAmount,
      branchId: branchId || null,
    });

    return this.cashRegisterRepository.save(register);
  }

  async close(
    id: string,
    closedById: string,
    closingAmount: number,
    notes?: string,
  ): Promise<CashRegister> {
    const register = await this.findOne(id);

    if (register.status === CashRegisterStatus.CLOSED) {
      throw new BadRequestException('Cash register is already closed');
    }

    register.status = CashRegisterStatus.CLOSED;
    register.closedById = closedById;
    register.closingAmount = closingAmount;
    register.closedAt = new Date();
    if (notes) register.notes = notes;

    return this.cashRegisterRepository.save(register);
  }

  async encashment(
    id: string,
    amount: number,
  ): Promise<CashRegister> {
    const register = await this.findOne(id);

    if (register.status === CashRegisterStatus.CLOSED) {
      throw new BadRequestException('Cannot encash from a closed register');
    }

    register.encashmentAmount = Number(register.encashmentAmount) + amount;
    return this.cashRegisterRepository.save(register);
  }

  async findOne(id: string): Promise<CashRegister> {
    const register = await this.cashRegisterRepository.findOne({
      where: { id },
    });
    if (!register) {
      throw new NotFoundException(`Cash register #${id} not found`);
    }
    return register;
  }

  async findCurrent(branchId?: string): Promise<CashRegister | null> {
    return this.cashRegisterRepository.findOne({
      where: {
        status: CashRegisterStatus.OPEN,
        ...(branchId ? { branchId } : {}),
      },
    });
  }

  async findAll(branchId?: string): Promise<CashRegister[]> {
    const qb = this.cashRegisterRepository.createQueryBuilder('cr');
    if (branchId) {
      qb.where('cr.branch_id = :branchId', { branchId });
    }
    return qb.orderBy('cr.opened_at', 'DESC').take(50).getMany();
  }

  async addTransaction(
    registerId: string,
    dto: CreateCashRegisterTransactionDto,
    performedById: string,
  ): Promise<CashRegisterTransaction> {
    const register = await this.findOne(registerId);

    if (register.status === CashRegisterStatus.CLOSED) {
      throw new BadRequestException('Cannot add transaction to a closed register');
    }

    if (dto.type === CashRegisterTransactionType.CASH_OUT) {
      const currentAmount =
        Number(register.openingAmount) +
        Number(register.cashSales) -
        Number(register.encashmentAmount);
      if (dto.amount > currentAmount) {
        throw new BadRequestException('Insufficient cash in register');
      }
    }

    const transaction = this.transactionRepository.create({
      cashRegisterId: registerId,
      type: dto.type,
      amount: dto.amount,
      description: dto.description || null,
      performedById,
    });

    // Update register totals for cash_in / cash_out
    if (dto.type === CashRegisterTransactionType.CASH_IN) {
      register.cashSales = Number(register.cashSales) + dto.amount;
    } else if (dto.type === CashRegisterTransactionType.CASH_OUT) {
      register.encashmentAmount = Number(register.encashmentAmount) + dto.amount;
    }

    await this.cashRegisterRepository.save(register);
    return this.transactionRepository.save(transaction);
  }

  async getTransactions(registerId: string): Promise<CashRegisterTransaction[]> {
    return this.transactionRepository.find({
      where: { cashRegisterId: registerId },
      order: { createdAt: 'DESC' },
    });
  }
}
