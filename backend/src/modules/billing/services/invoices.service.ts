import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, DataSource } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Service } from '../entities/service.entity';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { SearchInvoiceDto } from '../dto/search-invoice.dto';
import { LoyaltyService } from '../../loyalty/loyalty.service';

export interface PaginatedInvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly dataSource: DataSource,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const lastInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', {
        prefix: `INV-${year}${month}-%`,
      })
      .orderBy('invoice.invoiceNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `INV-${year}${month}-${String(sequence).padStart(5, '0')}`;
  }

  calculateItemAmount(
    unitPrice: number,
    quantity: number,
    discountPercent: number,
  ): number {
    const subtotal = unitPrice * quantity;
    const discount = subtotal * (discountPercent / 100);
    return Math.round((subtotal - discount) * 100) / 100;
  }

  calculateTotals(
    items: { unitPrice: number; quantity: number; discountPercent: number }[],
    discountAmount: number = 0,
  ): { totalAmount: number; finalAmount: number } {
    const totalAmount = items.reduce((sum, item) => {
      return sum + this.calculateItemAmount(item.unitPrice, item.quantity, item.discountPercent);
    }, 0);

    const finalAmount = Math.round((totalAmount - discountAmount) * 100) / 100;

    return {
      totalAmount: Math.round(totalAmount * 100) / 100,
      finalAmount: Math.max(finalAmount, 0),
    };
  }

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = await this.generateInvoiceNumber();

      // Resolve service prices and build items
      const itemsData: {
        serviceId: string;
        quantity: number;
        unitPrice: number;
        discountPercent: number;
        amount: number;
      }[] = [];

      for (const itemDto of dto.items) {
        const service = await this.serviceRepository.findOne({
          where: { id: itemDto.serviceId },
        });
        if (!service) {
          throw new NotFoundException(
            `Service with ID "${itemDto.serviceId}" not found`,
          );
        }

        const quantity = itemDto.quantity ?? 1;
        const discountPercent = itemDto.discountPercent ?? 0;
        const unitPrice = Number(service.price);
        const amount = this.calculateItemAmount(unitPrice, quantity, discountPercent);

        itemsData.push({
          serviceId: itemDto.serviceId,
          quantity,
          unitPrice,
          discountPercent,
          amount,
        });
      }

      const discountAmount = dto.discountAmount ?? 0;
      const { totalAmount, finalAmount } = this.calculateTotals(itemsData, discountAmount);

      const invoice = queryRunner.manager.create(Invoice, {
        patientId: dto.patientId,
        appointmentId: dto.appointmentId ?? null,
        invoiceNumber,
        totalAmount,
        discountAmount,
        finalAmount,
        status: dto.status ?? InvoiceStatus.DRAFT,
        notes: dto.notes ?? null,
        dueDate: dto.dueDate ?? null,
      });

      const savedInvoice = await queryRunner.manager.save(Invoice, invoice);

      const invoiceItems = itemsData.map((item) =>
        queryRunner.manager.create(InvoiceItem, {
          invoiceId: savedInvoice.id,
          ...item,
        }),
      );

      await queryRunner.manager.save(InvoiceItem, invoiceItems);
      await queryRunner.commitTransaction();

      return this.findOne(savedInvoice.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(searchDto: SearchInvoiceDto): Promise<PaginatedInvoicesResponse> {
    const {
      query,
      patientId,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.patient', 'patient')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('items.service', 'service');

    if (query) {
      const searchTerm = `%${query}%`;
      qb.where('invoice.invoiceNumber ILIKE :searchTerm', { searchTerm });
    }

    if (patientId) {
      qb.andWhere('invoice.patientId = :patientId', { patientId });
    }

    if (status) {
      qb.andWhere('invoice.status = :status', { status });
    }

    if (searchDto.branchId) {
      qb.andWhere('invoice.branch_id = :branchId', { branchId: searchDto.branchId });
    }

    qb.orderBy(`invoice.${sortBy}`, sortOrder);
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

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['patient', 'items', 'items.service', 'payments'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${id}" not found`);
    }
    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.CANCELLED ||
      invoice.status === InvoiceStatus.REFUNDED
    ) {
      throw new BadRequestException(
        `Cannot update invoice with status "${invoice.status}"`,
      );
    }

    if (dto.discountAmount !== undefined) {
      const { totalAmount, finalAmount } = this.calculateTotals(
        invoice.items.map((item) => ({
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          discountPercent: Number(item.discountPercent),
        })),
        dto.discountAmount,
      );
      invoice.totalAmount = totalAmount;
      invoice.discountAmount = dto.discountAmount;
      invoice.finalAmount = finalAmount;
    }

    if (dto.status !== undefined) invoice.status = dto.status;
    if (dto.notes !== undefined) invoice.notes = dto.notes;
    if (dto.dueDate !== undefined) invoice.dueDate = dto.dueDate;

    return this.invoiceRepository.save(invoice);
  }

  async markAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot mark a cancelled invoice as paid');
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();

    const saved = await this.invoiceRepository.save(invoice);

    if (saved.patientId) {
      try {
        await this.loyaltyService.registerPayment(
          saved.patientId,
          Number(saved.finalAmount),
        );
      } catch {
        // Loyalty accrual must not break invoice status updates.
      }
    }

    return saved;
  }

  async refund(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status !== InvoiceStatus.PAID) {
      throw new BadRequestException('Only paid invoices can be refunded');
    }

    invoice.status = InvoiceStatus.REFUNDED;
    return this.invoiceRepository.save(invoice);
  }

  async findOverdue(branchId?: string): Promise<Invoice[]> {
    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('invoice.due_date < :now', { now: new Date() })
      .leftJoinAndSelect('invoice.items', 'items');

    if (branchId) {
      qb.andWhere('invoice.branch_id = :branchId', { branchId });
    }

    return qb.orderBy('invoice.due_date', 'ASC').getMany();
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    await this.invoiceRepository.softRemove(invoice);
  }
}
