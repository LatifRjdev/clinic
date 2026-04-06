import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Invoice, InvoiceStatus } from '../billing/entities/invoice.entity';
import { Appointment, AppointmentStatus } from '../scheduling/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { UserRole } from '../../common/enums/roles.enum';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async getDashboard(role: string) {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = `${today.substring(0, 7)}-01`;

    const [
      todayAppointments,
      monthRevenue,
      totalPatients,
      totalDoctors,
    ] = await Promise.all([
      this.appointmentRepository.count({
        where: { date: new Date(today) },
      }),
      this.invoiceRepository
        .createQueryBuilder('i')
        .select('COALESCE(SUM(i.final_amount), 0)', 'total')
        .where('i.status IN (:...s)', { s: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID] })
        .andWhere('i.paid_at >= :from', { from: monthStart })
        .getRawOne(),
      this.patientRepository.count(),
      this.userRepository.count({ where: { role: UserRole.DOCTOR, isActive: true } }),
    ]);

    const base = {
      todayAppointments,
      monthRevenue: Number(monthRevenue?.total || 0),
      totalPatients,
      totalDoctors,
    };

    // Extra role-specific data
    if (role === 'reception') {
      const pendingConfirmation = await this.appointmentRepository.count({
        where: { date: new Date(today), status: AppointmentStatus.SCHEDULED },
      });
      const inQueue = await this.appointmentRepository.count({
        where: { date: new Date(today), status: AppointmentStatus.CONFIRMED },
      });
      return { ...base, pendingConfirmation, inQueue };
    }

    if (role === 'accountant') {
      const unpaidInvoices = await this.invoiceRepository.count({
        where: { status: In([InvoiceStatus.PENDING, InvoiceStatus.DRAFT]) },
      });
      const monthExpensesResult = await this.invoiceRepository.manager.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date >= $1`,
        [monthStart],
      );
      return {
        ...base,
        unpaidInvoices,
        monthExpenses: Number(monthExpensesResult?.[0]?.total || 0),
      };
    }

    return base;
  }

  async getAppointmentStats(dateFrom: string, dateTo: string) {
    const stats = await this.appointmentRepository
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('a.date >= :dateFrom', { dateFrom })
      .andWhere('a.date <= :dateTo', { dateTo })
      .groupBy('a.status')
      .getRawMany();

    const byType = await this.appointmentRepository
      .createQueryBuilder('a')
      .select('a.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('a.date >= :dateFrom', { dateFrom })
      .andWhere('a.date <= :dateTo', { dateTo })
      .groupBy('a.type')
      .getRawMany();

    return { byStatus: stats, byType };
  }

  async getRevenueAnalytics(dateFrom: string, dateTo: string) {
    const daily = await this.invoiceRepository
      .createQueryBuilder('i')
      .select("TO_CHAR(i.paid_at, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(i.final_amount)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .where('i.status = :s', { s: InvoiceStatus.PAID })
      .andWhere('i.paid_at >= :dateFrom', { dateFrom })
      .andWhere('i.paid_at <= :dateTo', { dateTo })
      .groupBy("TO_CHAR(i.paid_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return { daily };
  }

  async getDoctorLoad(dateFrom: string, dateTo: string) {
    return this.appointmentRepository
      .createQueryBuilder('a')
      .innerJoin('a.doctor', 'd')
      .select('d.id', 'doctorId')
      .addSelect("CONCAT(d.last_name, ' ', d.first_name)", 'doctorName')
      .addSelect('d.specialty', 'specialty')
      .addSelect('COUNT(*)', 'totalAppointments')
      .addSelect(
        `COUNT(CASE WHEN a.status = '${AppointmentStatus.COMPLETED}' THEN 1 END)`,
        'completedAppointments',
      )
      .where('a.date >= :dateFrom', { dateFrom })
      .andWhere('a.date <= :dateTo', { dateTo })
      .groupBy('d.id')
      .addGroupBy('d.last_name')
      .addGroupBy('d.first_name')
      .addGroupBy('d.specialty')
      .orderBy('"totalAppointments"', 'DESC')
      .getRawMany();
  }

  async getPatientStats(dateFrom: string, dateTo: string) {
    const newPatients = await this.patientRepository
      .createQueryBuilder('p')
      .select('COUNT(*)', 'count')
      .where('p.created_at >= :dateFrom', { dateFrom })
      .andWhere('p.created_at <= :dateTo', { dateTo })
      .getRawOne();

    const bySource = await this.patientRepository
      .createQueryBuilder('p')
      .select('p.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .where('p.created_at >= :dateFrom', { dateFrom })
      .andWhere('p.created_at <= :dateTo', { dateTo })
      .groupBy('p.source')
      .getRawMany();

    return {
      newPatients: Number(newPatients?.count || 0),
      bySource,
    };
  }

  async getServiceStats(dateFrom: string, dateTo: string) {
    return this.invoiceRepository
      .createQueryBuilder('i')
      .innerJoin('i.items', 'item')
      .innerJoin('item.service', 'service')
      .select('service.name', 'serviceName')
      .addSelect('service.category', 'category')
      .addSelect('SUM(item.quantity)', 'totalQuantity')
      .addSelect('SUM(item.amount)', 'totalRevenue')
      .where('i.status IN (:...s)', { s: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID] })
      .andWhere('i.created_at >= :dateFrom', { dateFrom })
      .andWhere('i.created_at <= :dateTo', { dateTo })
      .groupBy('service.name')
      .addGroupBy('service.category')
      .orderBy('"totalRevenue"', 'DESC')
      .getRawMany();
  }

  async getTrends(months: number = 12) {
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - months);
    const from = dateFrom.toISOString().split('T')[0];

    const revenue = await this.invoiceRepository
      .createQueryBuilder('i')
      .select("TO_CHAR(i.paid_at, 'YYYY-MM')", 'month')
      .addSelect('SUM(i.final_amount)', 'revenue')
      .where('i.status = :s', { s: InvoiceStatus.PAID })
      .andWhere('i.paid_at >= :from', { from })
      .groupBy("TO_CHAR(i.paid_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    const appointments = await this.appointmentRepository
      .createQueryBuilder('a')
      .select("TO_CHAR(a.date, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('a.date >= :from', { from })
      .groupBy("TO_CHAR(a.date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    const patients = await this.patientRepository
      .createQueryBuilder('p')
      .select("TO_CHAR(p.created_at, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('p.created_at >= :from', { from })
      .groupBy("TO_CHAR(p.created_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return { revenue, appointments, patients };
  }

  /**
   * Patient satisfaction analytics (NPS).
   * Rating is stored on 1-10 scale:
   *  - 9-10 = promoters
   *  - 7-8  = passives
   *  - 1-6  = detractors
   * NPS = %promoters - %detractors
   */
  async getSatisfaction(dateFrom?: string, dateTo?: string) {
    const qb = this.reviewRepository
      .createQueryBuilder('r')
      .where('r.isApproved = true');

    if (dateFrom) {
      qb.andWhere('r.created_at >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      qb.andWhere('r.created_at <= :dateTo', { dateTo });
    }

    const aggregate = await qb
      .clone()
      .select('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(r.id)', 'totalReviews')
      .getRawOne();

    const distributionRaw = await qb
      .clone()
      .select('r.rating', 'rating')
      .addSelect('COUNT(r.id)', 'count')
      .groupBy('r.rating')
      .orderBy('r.rating', 'ASC')
      .getRawMany();

    const distribution: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) distribution[i] = 0;
    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    for (const row of distributionRaw) {
      const rating = Number(row.rating);
      const count = parseInt(row.count, 10);
      distribution[rating] = count;
      if (rating >= 9) promoters += count;
      else if (rating >= 7) passives += count;
      else detractors += count;
    }

    const totalReviews = parseInt(aggregate?.totalReviews || '0', 10);
    const nps =
      totalReviews > 0
        ? Math.round(((promoters - detractors) / totalReviews) * 100)
        : 0;

    // Reviews within last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const recentReviewsCount = await this.reviewRepository
      .createQueryBuilder('r')
      .where('r.isApproved = true')
      .andWhere('r.created_at >= :since', { since })
      .getCount();

    return {
      averageRating: aggregate?.avgRating
        ? parseFloat(Number(aggregate.avgRating).toFixed(2))
        : 0,
      totalReviews,
      nps,
      promoters,
      passives,
      detractors,
      recentReviewsCount,
      distribution,
    };
  }
}
