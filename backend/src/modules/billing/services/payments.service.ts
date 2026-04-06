import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { SearchPaymentDto } from '../dto/search-payment.dto';
import { LoyaltyService } from '../../loyalty/loyalty.service';

export interface PaginatedPaymentsResponse {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly dataSource: DataSource,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: dto.invoiceId },
        relations: ['payments'],
      });

      if (!invoice) {
        throw new NotFoundException(
          `Invoice with ID "${dto.invoiceId}" not found`,
        );
      }

      if (
        invoice.status === InvoiceStatus.CANCELLED ||
        invoice.status === InvoiceStatus.REFUNDED
      ) {
        throw new BadRequestException(
          `Cannot add payment to invoice with status "${invoice.status}"`,
        );
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new BadRequestException('Invoice is already fully paid');
      }

      const existingPaymentsTotal = (invoice.payments || []).reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const remainingAmount =
        Math.round((Number(invoice.finalAmount) - existingPaymentsTotal) * 100) / 100;

      if (dto.amount > remainingAmount) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) exceeds remaining balance (${remainingAmount})`,
        );
      }

      const payment = queryRunner.manager.create(Payment, {
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      // Update invoice status based on total payments
      const newTotal =
        Math.round((existingPaymentsTotal + dto.amount) * 100) / 100;
      const finalAmount = Number(invoice.finalAmount);

      if (newTotal >= finalAmount) {
        invoice.status = InvoiceStatus.PAID;
        invoice.paidAt = new Date();
      } else if (newTotal > 0) {
        invoice.status = InvoiceStatus.PARTIALLY_PAID;
      }

      // Move from draft to pending if first payment attempt
      if (invoice.status === InvoiceStatus.DRAFT && newTotal > 0) {
        invoice.status =
          newTotal >= finalAmount
            ? InvoiceStatus.PAID
            : InvoiceStatus.PARTIALLY_PAID;
        if (newTotal >= finalAmount) {
          invoice.paidAt = new Date();
        }
      }

      await queryRunner.manager.save(Invoice, invoice);
      await queryRunner.commitTransaction();

      // Award loyalty points once the invoice becomes fully paid.
      if (invoice.status === InvoiceStatus.PAID && invoice.patientId) {
        try {
          await this.loyaltyService.registerPayment(
            invoice.patientId,
            Number(invoice.finalAmount),
          );
        } catch {
          // Loyalty accrual must not break payment processing.
        }
      }

      return savedPayment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(searchDto: SearchPaymentDto): Promise<PaginatedPaymentsResponse> {
    const {
      invoiceId,
      method,
      query,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice');

    if (invoiceId) {
      qb.andWhere('payment.invoiceId = :invoiceId', { invoiceId });
    }

    if (method) {
      qb.andWhere('payment.method = :method', { method });
    }

    if (searchDto.branchId) {
      qb.andWhere('invoice.branch_id = :branchId', { branchId: searchDto.branchId });
    }

    if (query) {
      const searchTerm = `%${query}%`;
      qb.andWhere('payment.reference ILIKE :searchTerm', { searchTerm });
    }

    qb.orderBy(`payment.${sortBy}`, sortOrder);
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['invoice'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${id}" not found`);
    }
    return payment;
  }

  async remove(id: string): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.softRemove(payment);
  }
}
