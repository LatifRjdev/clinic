import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollEntry, PayrollStatus } from '../entities/payroll-entry.entity';
import { PayrollSettings } from '../entities/payroll-settings.entity';
import { Invoice, InvoiceStatus } from '../../billing/entities/invoice.entity';
import { UpdatePayrollEntryDto } from '../dto/update-payroll-entry.dto';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollEntry)
    private readonly entryRepository: Repository<PayrollEntry>,
    @InjectRepository(PayrollSettings)
    private readonly settingsRepository: Repository<PayrollSettings>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  // --- Settings ---

  async getSettings(employeeId: string): Promise<PayrollSettings | null> {
    return this.settingsRepository.findOne({ where: { employeeId } });
  }

  async upsertSettings(
    employeeId: string,
    data: Partial<PayrollSettings>,
  ): Promise<PayrollSettings> {
    let settings = await this.settingsRepository.findOne({ where: { employeeId } });
    if (settings) {
      Object.assign(settings, data);
    } else {
      settings = this.settingsRepository.create({ employeeId, ...data });
    }
    return this.settingsRepository.save(settings);
  }

  // --- Payroll Entries ---

  async calculate(
    employeeId: string,
    year: number,
    month: number,
  ): Promise<PayrollEntry> {
    // Check if already exists
    const existing = await this.entryRepository.findOne({
      where: { employeeId, year, month },
    });
    if (existing && existing.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException(
        `Payroll for ${year}-${month} already ${existing.status}`,
      );
    }

    const settings = await this.settingsRepository.findOne({
      where: { employeeId },
    });

    const baseSalary = settings ? Number(settings.baseSalary) : 0;
    const bonusPercent = settings ? Number(settings.bonusPercent) : 0;
    const taxRate = settings ? Number(settings.taxRate) : 13;

    // Calculate servicesRevenue from paid invoices for the period
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 1);

    const { revenue, count } = await this.invoiceRepository
      .createQueryBuilder('inv')
      .innerJoin('appointments', 'apt', 'apt.id = inv.appointment_id')
      .where('apt.doctor_id = :employeeId', { employeeId })
      .andWhere('inv.status = :status', { status: InvoiceStatus.PAID })
      .andWhere('inv.paid_at >= :periodStart', { periodStart })
      .andWhere('inv.paid_at < :periodEnd', { periodEnd })
      .select('COALESCE(SUM(inv.final_amount), 0)', 'revenue')
      .addSelect('COUNT(inv.id)', 'count')
      .getRawOne()
      .then((row) => ({
        revenue: Number(row?.revenue ?? 0),
        count: Number(row?.count ?? 0),
      }));

    const servicesRevenue = revenue;
    const servicesCount = count;
    const serviceBonus = servicesRevenue * (bonusPercent / 100);
    const grossAmount = baseSalary + serviceBonus;
    const taxAmount = grossAmount * (taxRate / 100);
    const netAmount = grossAmount - taxAmount;

    if (existing) {
      Object.assign(existing, {
        baseSalary,
        serviceBonus,
        taxAmount,
        netAmount,
        servicesCount,
        servicesRevenue,
        bonusPercent,
        status: PayrollStatus.CALCULATED,
      });
      return this.entryRepository.save(existing);
    }

    const entry = this.entryRepository.create({
      employeeId,
      year,
      month,
      baseSalary,
      serviceBonus,
      taxAmount,
      netAmount,
      servicesCount,
      servicesRevenue,
      bonusPercent,
      status: PayrollStatus.CALCULATED,
    });

    return this.entryRepository.save(entry);
  }

  async findAll(params?: {
    year?: number;
    month?: number;
    status?: PayrollStatus;
    branchId?: string;
  }): Promise<PayrollEntry[]> {
    const qb = this.entryRepository.createQueryBuilder('p');
    if (params?.year) qb.andWhere('p.year = :year', { year: params.year });
    if (params?.month) qb.andWhere('p.month = :month', { month: params.month });
    if (params?.status) qb.andWhere('p.status = :status', { status: params.status });
    if (params?.branchId) qb.andWhere('p.branch_id = :branchId', { branchId: params.branchId });
    return qb.orderBy('p.year', 'DESC').addOrderBy('p.month', 'DESC').getMany();
  }

  async findOne(id: string): Promise<PayrollEntry> {
    const entry = await this.entryRepository.findOne({ where: { id } });
    if (!entry) throw new NotFoundException(`Payroll entry #${id} not found`);
    return entry;
  }

  async update(id: string, dto: UpdatePayrollEntryDto): Promise<PayrollEntry> {
    const entry = await this.findOne(id);
    if (entry.status !== PayrollStatus.CALCULATED) {
      throw new BadRequestException('Only calculated entries can be edited');
    }

    if (dto.serviceBonus !== undefined) {
      entry.serviceBonus = dto.serviceBonus;
    }
    if (dto.deductions !== undefined) {
      entry.deductions = dto.deductions;
    }
    if (dto.deductionReason !== undefined) {
      entry.deductionReason = dto.deductionReason;
    }

    // Recalculate tax and net based on settings
    const settings = await this.settingsRepository.findOne({
      where: { employeeId: entry.employeeId },
    });
    const taxRate = settings ? Number(settings.taxRate) : 13;
    const grossAmount = Number(entry.baseSalary) + Number(entry.serviceBonus);
    entry.taxAmount = grossAmount * (taxRate / 100);
    entry.netAmount = grossAmount - entry.taxAmount - Number(entry.deductions);

    return this.entryRepository.save(entry);
  }

  async approve(id: string, approvedById: string): Promise<PayrollEntry> {
    const entry = await this.findOne(id);
    if (entry.status !== PayrollStatus.CALCULATED) {
      throw new BadRequestException('Only calculated entries can be approved');
    }
    entry.status = PayrollStatus.APPROVED;
    entry.approvedById = approvedById;
    return this.entryRepository.save(entry);
  }

  async markPaid(id: string): Promise<PayrollEntry> {
    const entry = await this.findOne(id);
    if (entry.status !== PayrollStatus.APPROVED) {
      throw new BadRequestException('Only approved entries can be marked as paid');
    }
    entry.status = PayrollStatus.PAID;
    entry.paidAt = new Date();
    return this.entryRepository.save(entry);
  }

  // --- Payroll sheet (batch for a month) ---

  async getSheet(
    year: number,
    month: number,
  ): Promise<{ entries: PayrollEntry[]; totalNet: number; totalTax: number }> {
    const entries = await this.entryRepository.find({
      where: { year, month },
      order: { employeeId: 'ASC' },
    });

    const totalNet = entries.reduce((sum, e) => sum + Number(e.netAmount), 0);
    const totalTax = entries.reduce((sum, e) => sum + Number(e.taxAmount), 0);

    return { entries, totalNet, totalTax };
  }
}
