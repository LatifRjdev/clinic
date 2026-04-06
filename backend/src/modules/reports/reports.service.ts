import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../billing/entities/invoice.entity';
import { Expense } from '../billing/entities/expense.entity';
import { Payment } from '../billing/entities/payment.entity';
import { CashRegister } from '../billing/entities/cash-register.entity';
import { Appointment, AppointmentStatus } from '../scheduling/entities/appointment.entity';
import { User } from '../auth/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { MedicalRecord } from '../emr/entities/medical-record.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CustomReportDto, ReportDataSource } from './dto/custom-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    @InjectRepository(InventoryItem)
    private readonly inventoryItemRepository: Repository<InventoryItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
  ) {}

  async getDailyCashierReport(date: string, branchId?: string) {
    if (!date) throw new BadRequestException('date is required');

    const dayStart = `${date} 00:00:00`;
    const dayEnd = `${date} 23:59:59`;

    // Invoices created on that day
    const createdQb = this.invoiceRepository
      .createQueryBuilder('i')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(i.final_amount), 0)', 'total')
      .where('i.created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd });
    if (branchId) createdQb.andWhere('i.branch_id = :branchId', { branchId });
    const createdStats = await createdQb.getRawOne();

    // Paid invoices on that day (by paid_at)
    const paidQb = this.invoiceRepository
      .createQueryBuilder('i')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(i.final_amount), 0)', 'total')
      .where('i.status = :status', { status: InvoiceStatus.PAID })
      .andWhere('i.paid_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd });
    if (branchId) paidQb.andWhere('i.branch_id = :branchId', { branchId });
    const paidStats = await paidQb.getRawOne();

    // Payment method breakdown (using payments table joined with invoices)
    const paymentsQb = this.paymentRepository
      .createQueryBuilder('p')
      .innerJoin('p.invoice', 'i')
      .select('p.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd });
    if (branchId) paymentsQb.andWhere('i.branch_id = :branchId', { branchId });
    paymentsQb.groupBy('p.method');
    const paymentsByMethod = await paymentsQb.getRawMany();

    const methodMap: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      transfer: { count: 0, total: 0 },
      insurance: { count: 0, total: 0 },
    };
    for (const row of paymentsByMethod) {
      if (methodMap[row.method]) {
        methodMap[row.method] = {
          count: Number(row.count || 0),
          total: Number(row.total || 0),
        };
      }
    }

    // Refunds (invoices refunded on that day)
    const refundQb = this.invoiceRepository
      .createQueryBuilder('i')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(i.final_amount), 0)', 'total')
      .where('i.status = :status', { status: InvoiceStatus.REFUNDED })
      .andWhere('i.updated_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd });
    if (branchId) refundQb.andWhere('i.branch_id = :branchId', { branchId });
    const refundStats = await refundQb.getRawOne();

    // Cash register sessions for the day
    const sessionsQb = this.cashRegisterRepository
      .createQueryBuilder('cr')
      .where('cr.opened_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd });
    if (branchId) sessionsQb.andWhere('cr.branch_id = :branchId', { branchId });
    sessionsQb.orderBy('cr.opened_at', 'ASC');
    const sessions = await sessionsQb.getMany();

    const paidTotal = Number(paidStats?.total || 0);
    const refundTotal = Number(refundStats?.total || 0);

    return {
      date,
      branchId: branchId || null,
      invoices: {
        created: {
          count: Number(createdStats?.count || 0),
          total: Number(createdStats?.total || 0),
        },
        paid: {
          count: Number(paidStats?.count || 0),
          total: paidTotal,
        },
      },
      paymentMethods: {
        cash: methodMap.cash,
        card: methodMap.card,
        transfer: methodMap.transfer,
        insurance: methodMap.insurance,
      },
      refunds: {
        count: Number(refundStats?.count || 0),
        total: refundTotal,
      },
      netIncome: paidTotal - refundTotal,
      cashRegisterSessions: sessions,
    };
  }

  async getMonthlyAccountingReport(year: number, month: number, branchId?: string) {
    if (!year || !month || month < 1 || month > 12) {
      throw new BadRequestException('Valid year and month (1-12) are required');
    }

    const monthStr = String(month).padStart(2, '0');
    const dateFrom = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateTo = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
    const rangeStart = `${dateFrom} 00:00:00`;
    const rangeEnd = `${dateTo} 23:59:59`;

    // Total revenue
    const revenueQb = this.invoiceRepository
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.final_amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('i.created_at BETWEEN :rangeStart AND :rangeEnd', { rangeStart, rangeEnd });
    if (branchId) revenueQb.andWhere('i.branch_id = :branchId', { branchId });
    const revenueStats = await revenueQb.getRawOne();

    // Total expenses
    const expensesQb = this.expenseRepository
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('e.expense_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });
    if (branchId) expensesQb.andWhere('e.branch_id = :branchId', { branchId });
    const expenseStats = await expensesQb.getRawOne();

    // Breakdown by service category
    const categoryQb = this.invoiceRepository
      .createQueryBuilder('i')
      .innerJoin('i.items', 'item')
      .innerJoin('item.service', 'service')
      .select('service.category', 'category')
      .addSelect('COALESCE(SUM(item.amount), 0)', 'total')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'count')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('i.created_at BETWEEN :rangeStart AND :rangeEnd', { rangeStart, rangeEnd });
    if (branchId) categoryQb.andWhere('i.branch_id = :branchId', { branchId });
    categoryQb.groupBy('service.category').orderBy('total', 'DESC');
    const byCategory = await categoryQb.getRawMany();

    // Breakdown by payment method
    const methodQb = this.paymentRepository
      .createQueryBuilder('p')
      .innerJoin('p.invoice', 'i')
      .select('p.method', 'method')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('p.created_at BETWEEN :rangeStart AND :rangeEnd', { rangeStart, rangeEnd });
    if (branchId) methodQb.andWhere('i.branch_id = :branchId', { branchId });
    methodQb.groupBy('p.method').orderBy('total', 'DESC');
    const byPaymentMethod = await methodQb.getRawMany();

    // Insurance vs cash patients ratio (based on paid invoices' patients)
    const ratioQb = this.invoiceRepository
      .createQueryBuilder('i')
      .innerJoin('i.patient', 'patient')
      .select(
        'CASE WHEN patient.insurance_company_id IS NOT NULL THEN :insured ELSE :cash END',
        'type',
      )
      .addSelect('COUNT(DISTINCT patient.id)', 'patients')
      .addSelect('COALESCE(SUM(i.final_amount), 0)', 'total')
      .setParameters({ insured: 'insurance', cash: 'cash' })
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('i.created_at BETWEEN :rangeStart AND :rangeEnd', { rangeStart, rangeEnd });
    if (branchId) ratioQb.andWhere('i.branch_id = :branchId', { branchId });
    ratioQb.groupBy('type');
    const insuranceVsCash = await ratioQb.getRawMany();

    // Top 10 services by revenue
    const topServicesQb = this.invoiceRepository
      .createQueryBuilder('i')
      .innerJoin('i.items', 'item')
      .innerJoin('item.service', 'service')
      .select('service.id', 'serviceId')
      .addSelect('service.name', 'serviceName')
      .addSelect('service.category', 'category')
      .addSelect('COALESCE(SUM(item.amount), 0)', 'revenue')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('i.created_at BETWEEN :rangeStart AND :rangeEnd', { rangeStart, rangeEnd });
    if (branchId) topServicesQb.andWhere('i.branch_id = :branchId', { branchId });
    topServicesQb
      .groupBy('service.id')
      .addGroupBy('service.name')
      .addGroupBy('service.category')
      .orderBy('revenue', 'DESC')
      .limit(10);
    const topServices = await topServicesQb.getRawMany();

    const revenue = Number(revenueStats?.total || 0);
    const expenses = Number(expenseStats?.total || 0);

    return {
      period: { year, month, dateFrom, dateTo },
      branchId: branchId || null,
      revenue: {
        total: revenue,
        invoiceCount: Number(revenueStats?.count || 0),
      },
      expenses: {
        total: expenses,
        count: Number(expenseStats?.count || 0),
      },
      netProfit: revenue - expenses,
      byServiceCategory: byCategory,
      byPaymentMethod,
      insuranceVsCash,
      topServices,
    };
  }

  async getDoctorWorkloadReport(from: string, to: string, branchId?: string) {
    if (!from || !to) {
      throw new BadRequestException('from and to dates are required');
    }

    const rangeStart = `${from} 00:00:00`;
    const rangeEnd = `${to} 23:59:59`;

    // Per-doctor appointment stats
    const apptQb = this.appointmentRepository
      .createQueryBuilder('a')
      .innerJoin('a.doctor', 'doctor')
      .select('doctor.id', 'doctorId')
      .addSelect("CONCAT(doctor.last_name, ' ', doctor.first_name)", 'doctorName')
      .addSelect('doctor.specialty', 'specialty')
      .addSelect('COUNT(a.id)', 'total')
      .addSelect(
        `SUM(CASE WHEN a.status = '${AppointmentStatus.COMPLETED}' THEN 1 ELSE 0 END)`,
        'completed',
      )
      .addSelect(
        `SUM(CASE WHEN a.status = '${AppointmentStatus.CANCELLED}' THEN 1 ELSE 0 END)`,
        'cancelled',
      )
      .addSelect(
        `SUM(CASE WHEN a.status = '${AppointmentStatus.NO_SHOW}' THEN 1 ELSE 0 END)`,
        'noShow',
      )
      .addSelect('COUNT(DISTINCT a.patient_id)', 'uniquePatients')
      .addSelect('COUNT(DISTINCT a.date)', 'workingDays')
      .addSelect(
        `COALESCE(SUM(
           EXTRACT(EPOCH FROM (a.end_time::time - a.start_time::time)) / 3600.0
         ), 0)`,
        'workingHours',
      )
      .where('a.date BETWEEN :from AND :to', { from, to });
    if (branchId) apptQb.andWhere('a.branch_id = :branchId', { branchId });
    apptQb
      .groupBy('doctor.id')
      .addGroupBy('doctor.last_name')
      .addGroupBy('doctor.first_name')
      .addGroupBy('doctor.specialty')
      .orderBy('total', 'DESC');
    const apptStats = await apptQb.getRawMany();

    // Revenue per doctor (from invoices linked via appointment)
    const revenueQb = this.invoiceRepository
      .createQueryBuilder('i')
      .innerJoin('i.appointment', 'a')
      .select('a.doctor_id', 'doctorId')
      .addSelect('COALESCE(SUM(i.final_amount), 0)', 'revenue')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('i.created_at BETWEEN :rangeStart AND :rangeEnd', { rangeStart, rangeEnd });
    if (branchId) revenueQb.andWhere('i.branch_id = :branchId', { branchId });
    revenueQb.groupBy('a.doctor_id');
    const revenueRows = await revenueQb.getRawMany();
    const revenueMap = new Map<string, number>();
    for (const r of revenueRows) {
      revenueMap.set(r.doctorId, Number(r.revenue || 0));
    }

    const result = apptStats.map((row) => {
      const total = Number(row.total || 0);
      const workingDays = Number(row.workingDays || 0);
      return {
        doctorId: row.doctorId,
        doctorName: row.doctorName,
        specialty: row.specialty,
        totalAppointments: total,
        completed: Number(row.completed || 0),
        cancelled: Number(row.cancelled || 0),
        noShow: Number(row.noShow || 0),
        uniquePatients: Number(row.uniquePatients || 0),
        workingDays,
        workingHours: Number(Number(row.workingHours || 0).toFixed(2)),
        averagePerDay:
          workingDays > 0 ? Number((total / workingDays).toFixed(2)) : 0,
        revenue: revenueMap.get(row.doctorId) || 0,
      };
    });

    return {
      period: { from, to },
      branchId: branchId || null,
      doctors: result,
    };
  }

  async getRevenue(dateFrom: string, dateTo: string, branchId?: string) {
    const qb = this.invoiceRepository
      .createQueryBuilder('i')
      .select('SUM(i.final_amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('i.created_at >= :dateFrom', { dateFrom })
      .andWhere('i.created_at <= :dateTo', { dateTo });

    if (branchId) qb.andWhere('i.branch_id = :branchId', { branchId });

    return qb.getRawOne();
  }

  async getExpenses(dateFrom: string, dateTo: string, branchId?: string) {
    const qb = this.expenseRepository
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .addSelect('e.category', 'category')
      .where('e.expense_date >= :dateFrom', { dateFrom })
      .andWhere('e.expense_date <= :dateTo', { dateTo });

    if (branchId) qb.andWhere('e.branch_id = :branchId', { branchId });

    qb.groupBy('e.category');

    return qb.getRawMany();
  }

  async getProfitLoss(dateFrom: string, dateTo: string, branchId?: string) {
    const revenue = await this.getRevenue(dateFrom, dateTo, branchId);
    const expenses = await this.getExpenses(dateFrom, dateTo, branchId);

    const totalExpenses = expenses.reduce(
      (sum: number, e: any) => sum + Number(e.total || 0),
      0,
    );

    return {
      revenue: Number(revenue?.total || 0),
      invoiceCount: Number(revenue?.count || 0),
      expenses: totalExpenses,
      expensesByCategory: expenses,
      profit: Number(revenue?.total || 0) - totalExpenses,
      period: { dateFrom, dateTo },
    };
  }

  async getCashFlow(dateFrom: string, dateTo: string, branchId?: string) {
    // Income by month
    const income = await this.invoiceRepository
      .createQueryBuilder('i')
      .select("TO_CHAR(i.paid_at, 'YYYY-MM')", 'month')
      .addSelect('SUM(i.final_amount)', 'amount')
      .where('i.status = :status', { status: InvoiceStatus.PAID })
      .andWhere('i.paid_at >= :dateFrom', { dateFrom })
      .andWhere('i.paid_at <= :dateTo', { dateTo })
      .groupBy("TO_CHAR(i.paid_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Expenses by month
    const outflow = await this.expenseRepository
      .createQueryBuilder('e')
      .select("TO_CHAR(e.expense_date, 'YYYY-MM')", 'month')
      .addSelect('SUM(e.amount)', 'amount')
      .where('e.expense_date >= :dateFrom', { dateFrom })
      .andWhere('e.expense_date <= :dateTo', { dateTo })
      .groupBy("TO_CHAR(e.expense_date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return { income, outflow };
  }

  async getRevenueByServices(dateFrom: string, dateTo: string) {
    return this.invoiceRepository
      .createQueryBuilder('i')
      .innerJoin('i.items', 'item')
      .innerJoin('item.service', 'service')
      .select('service.name', 'serviceName')
      .addSelect('service.category', 'category')
      .addSelect('SUM(item.amount)', 'total')
      .addSelect('SUM(item.quantity)', 'count')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('i.created_at >= :dateFrom', { dateFrom })
      .andWhere('i.created_at <= :dateTo', { dateTo })
      .groupBy('service.name')
      .addGroupBy('service.category')
      .orderBy('total', 'DESC')
      .getRawMany();
  }

  async getRevenueByDoctors(dateFrom: string, dateTo: string) {
    return this.appointmentRepository
      .createQueryBuilder('a')
      .innerJoin('a.doctor', 'doctor')
      .innerJoin(Invoice, 'i', 'i.appointment_id = a.id')
      .select('doctor.id', 'doctorId')
      .addSelect("CONCAT(doctor.last_name, ' ', doctor.first_name)", 'doctorName')
      .addSelect('SUM(i.final_amount)', 'revenue')
      .addSelect('COUNT(DISTINCT a.id)', 'appointmentsCount')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('a.date >= :dateFrom', { dateFrom })
      .andWhere('a.date <= :dateTo', { dateTo })
      .groupBy('doctor.id')
      .addGroupBy('doctor.last_name')
      .addGroupBy('doctor.first_name')
      .orderBy('revenue', 'DESC')
      .getRawMany();
  }

  async getTaxReport(year: number) {
    const dateFrom = `${year}-01-01`;
    const dateTo = `${year}-12-31`;

    const quarterlyRevenue = await this.invoiceRepository
      .createQueryBuilder('i')
      .select("EXTRACT(QUARTER FROM i.paid_at)", 'quarter')
      .addSelect('SUM(i.final_amount)', 'revenue')
      .where('i.status = :status', { status: InvoiceStatus.PAID })
      .andWhere('i.paid_at >= :dateFrom', { dateFrom })
      .andWhere('i.paid_at <= :dateTo', { dateTo })
      .groupBy("EXTRACT(QUARTER FROM i.paid_at)")
      .orderBy('quarter', 'ASC')
      .getRawMany();

    const quarterlyExpenses = await this.expenseRepository
      .createQueryBuilder('e')
      .select("EXTRACT(QUARTER FROM e.expense_date)", 'quarter')
      .addSelect('SUM(e.amount)', 'expenses')
      .where('e.expense_date >= :dateFrom', { dateFrom })
      .andWhere('e.expense_date <= :dateTo', { dateTo })
      .groupBy("EXTRACT(QUARTER FROM e.expense_date)")
      .orderBy('quarter', 'ASC')
      .getRawMany();

    return { year, quarterlyRevenue, quarterlyExpenses };
  }

  async getDepartments(dateFrom: string, dateTo: string) {
    const result = await this.appointmentRepository
      .createQueryBuilder('a')
      .leftJoin('a.doctor', 'doctor')
      .select('doctor.specialty', 'department')
      .addSelect('COUNT(a.id)', 'appointments')
      .addSelect('COUNT(DISTINCT a.patient_id)', 'uniquePatients')
      .where('a.date >= :dateFrom', { dateFrom })
      .andWhere('a.date <= :dateTo', { dateTo })
      .andWhere('doctor.specialty IS NOT NULL')
      .groupBy('doctor.specialty')
      .orderBy('appointments', 'DESC')
      .getRawMany();

    // Revenue per department
    const revenueByDept = await this.invoiceRepository
      .createQueryBuilder('i')
      .leftJoin('users', 'doctor', 'doctor.id = i.doctor_id')
      .select('doctor.specialty', 'department')
      .addSelect('SUM(i.final_amount)', 'revenue')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
      })
      .andWhere('i.created_at >= :dateFrom', { dateFrom })
      .andWhere('i.created_at <= :dateTo', { dateTo })
      .andWhere('doctor.specialty IS NOT NULL')
      .groupBy('doctor.specialty')
      .orderBy('revenue', 'DESC')
      .getRawMany();

    return { appointments: result, revenue: revenueByDept };
  }

  async getCustomReport(dto: CustomReportDto) {
    const { dataSource, columns, filters, groupBy } = dto;

    const repoMap: Record<ReportDataSource, { repo: Repository<any>; alias: string; dateField: string }> = {
      [ReportDataSource.APPOINTMENTS]: { repo: this.appointmentRepository, alias: 'a', dateField: 'a.date' },
      [ReportDataSource.PATIENTS]: { repo: this.patientRepository, alias: 'p', dateField: 'p.created_at' },
      [ReportDataSource.INVOICES]: { repo: this.invoiceRepository, alias: 'i', dateField: 'i.created_at' },
      [ReportDataSource.EMR_RECORDS]: { repo: this.medicalRecordRepository, alias: 'r', dateField: 'r.created_at' },
      [ReportDataSource.INVENTORY]: { repo: this.inventoryItemRepository, alias: 'inv', dateField: 'inv.created_at' },
    };

    const config = repoMap[dataSource];
    if (!config) {
      throw new BadRequestException(`Unknown data source: ${dataSource}`);
    }

    const { repo, alias, dateField } = config;
    const qb = repo.createQueryBuilder(alias);

    // Add joins for appointments and emr_records to get related names
    if (dataSource === ReportDataSource.APPOINTMENTS) {
      qb.leftJoinAndSelect(`${alias}.doctor`, 'doctor');
      qb.leftJoinAndSelect(`${alias}.patient`, 'patient');
    }
    if (dataSource === ReportDataSource.EMR_RECORDS) {
      qb.leftJoinAndSelect(`${alias}.doctor`, 'doctor');
      qb.leftJoinAndSelect(`${alias}.patient`, 'patient');
    }

    // Apply filters
    if (filters?.dateFrom) {
      qb.andWhere(`${dateField} >= :dateFrom`, { dateFrom: filters.dateFrom });
    }
    if (filters?.dateTo) {
      qb.andWhere(`${dateField} <= :dateTo`, { dateTo: filters.dateTo });
    }
    if (filters?.doctorId) {
      if (dataSource === ReportDataSource.APPOINTMENTS || dataSource === ReportDataSource.EMR_RECORDS) {
        qb.andWhere(`${alias}.doctor_id = :doctorId`, { doctorId: filters.doctorId });
      }
    }
    if (filters?.status) {
      qb.andWhere(`${alias}.status = :status`, { status: filters.status });
    }
    if (filters?.category) {
      if (dataSource === ReportDataSource.INVENTORY) {
        qb.andWhere(`${alias}.category = :category`, { category: filters.category });
      }
    }

    // Apply groupBy for aggregation
    if (groupBy) {
      const groupField = `${alias}.${groupBy}`;
      qb.select(groupField, 'group');
      qb.addSelect('COUNT(*)', 'count');

      // Add SUM for numeric fields based on data source
      if (dataSource === ReportDataSource.INVOICES) {
        qb.addSelect('SUM(i.final_amount)', 'totalAmount');
      }
      if (dataSource === ReportDataSource.INVENTORY) {
        qb.addSelect('SUM(inv.quantity)', 'totalQuantity');
      }

      qb.groupBy(groupField);
      qb.orderBy('count', 'DESC');

      const data = await qb.getRawMany();
      return { data, total: data.length, grouped: true, groupBy };
    }

    // Non-grouped: return raw rows
    qb.orderBy(`${dateField}`, 'DESC');
    qb.take(500); // Limit for safety

    const [data, total] = await qb.getManyAndCount();
    return { data, total, grouped: false };
  }
}
