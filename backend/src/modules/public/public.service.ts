import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { DoctorSchedule } from '../scheduling/entities/doctor-schedule.entity';
import { Appointment, AppointmentStatus, AppointmentType, AppointmentSource } from '../scheduling/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Service } from '../billing/entities/service.entity';
import { Department } from '../staff/entities/department.entity';
import { SystemSettings } from '../system/entities/system-settings.entity';
import { UserRole } from '../../common/enums/roles.enum';
import { RedisCacheService } from '../cache/cache.service';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DoctorSchedule)
    private readonly scheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(SystemSettings)
    private readonly systemSettingsRepository: Repository<SystemSettings>,
    private readonly cacheService: RedisCacheService,
  ) {}

  async getDefaultCurrency(): Promise<{ currency: string }> {
    const setting = await this.systemSettingsRepository.findOne({
      where: { key: 'default_currency' },
    });
    return { currency: setting?.value || 'TJS' };
  }

  async getStats() {
    const patientCount = await this.patientRepository.count();
    const doctorCount = await this.userRepository.count({
      where: { role: UserRole.DOCTOR, isActive: true },
    });
    const serviceCount = await this.serviceRepository.count({
      where: { isActive: true },
    });
    const yearsActive = new Date().getFullYear() - 2016;

    return { patientCount, doctorCount, serviceCount, yearsActive };
  }

  async getDoctorProfile(id: string) {
    const doctor = await this.userRepository.findOne({
      where: { id, role: UserRole.DOCTOR, isActive: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Get department info
    let department: { id: string; name: string } | null = null;
    if (doctor.departmentId) {
      const dept = await this.departmentRepository.findOne({
        where: { id: doctor.departmentId },
      });
      if (dept) {
        department = { id: dept.id, name: dept.name };
      }
    }

    // Get schedule
    const schedules = await this.scheduleRepository.find({
      where: { doctorId: id, isActive: true },
      order: { dayOfWeek: 'ASC' },
    });

    const schedule = schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      breakStart: s.breakStart,
      breakEnd: s.breakEnd,
      slotDuration: s.slotDuration,
    }));

    // Get services from doctor's department
    let services: {
      id: string;
      name: string;
      code: string;
      category: string;
      price: number;
      duration: number;
    }[] = [];

    if (doctor.departmentId) {
      const deptServices = await this.serviceRepository.find({
        where: { departmentId: doctor.departmentId, isActive: true },
      });

      services = deptServices.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        category: s.category,
        price: s.price,
        duration: s.duration,
      }));
    }

    return {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      middleName: doctor.middleName,
      specialty: doctor.specialty,
      qualification: doctor.qualification,
      licenseNumber: doctor.licenseNumber,
      photoUrl: doctor.photoUrl,
      department,
      schedule,
      services,
    };
  }

  async getServices(category?: string) {
    const qb = this.serviceRepository
      .createQueryBuilder('s')
      .select([
        's.id',
        's.name',
        's.code',
        's.description',
        's.category',
        's.price',
        's.duration',
      ])
      .where('s.isActive = true');

    if (category) {
      qb.andWhere('s.category = :category', { category });
    }

    return qb.orderBy('s.category', 'ASC').addOrderBy('s.name', 'ASC').getMany();
  }

  async getDoctors(specialty?: string, branchId?: string) {
    const run = async () => {
      const qb = this.userRepository
        .createQueryBuilder('u')
        .select(['u.id', 'u.firstName', 'u.lastName', 'u.specialty', 'u.qualification', 'u.photoUrl'])
        .where('u.role = :role', { role: UserRole.DOCTOR })
        .andWhere('u.isActive = true');

      if (specialty) qb.andWhere('u.specialty = :specialty', { specialty });
      if (branchId) qb.andWhere('u.branchId = :branchId', { branchId });

      return qb.orderBy('u.lastName', 'ASC').getMany();
    };

    // Cache only the common unfiltered case (rarely changes, read-heavy public endpoint).
    if (!specialty && !branchId) {
      return this.cacheService.getOrSet('public:doctors:all', run, 300);
    }
    return run();
  }

  async getSpecialties() {
    return this.cacheService.getOrSet(
      'public:specialties:all',
      async () => {
        const result = await this.userRepository
          .createQueryBuilder('u')
          .select('DISTINCT u.specialty', 'specialty')
          .where('u.role = :role', { role: UserRole.DOCTOR })
          .andWhere('u.isActive = true')
          .andWhere('u.specialty IS NOT NULL')
          .getRawMany();

        return result.map((r) => r.specialty).filter(Boolean);
      },
      300,
    );
  }

  async getAvailableSlots(doctorId: string, date: string) {
    const requestedDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Нельзя записаться более чем на 14 дней вперёд
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 14);
    if (requestedDate > maxDate) {
      return [];
    }

    const dayOfWeek = requestedDate.getDay();

    // Get doctor schedule for this day
    const schedules = await this.scheduleRepository.find({
      where: { doctorId, dayOfWeek, isActive: true },
    });

    if (schedules.length === 0) return [];

    // Get existing appointments for this day
    const appointments = await this.appointmentRepository.find({
      where: {
        doctorId,
        date: new Date(date),
        status: Not(AppointmentStatus.CANCELLED),
      },
    });

    const bookedTimes = new Set(appointments.map((a) => a.startTime));

    // Generate slots using doctor's slotDuration
    const slots: { startTime: string; endTime: string; available: boolean }[] = [];

    for (const schedule of schedules) {
      const slotDuration = schedule.slotDuration || 30;
      let current = this.timeToMinutes(schedule.startTime);
      const end = this.timeToMinutes(schedule.endTime);

      // Exclude break
      const breakStart = schedule.breakStart ? this.timeToMinutes(schedule.breakStart) : null;
      const breakEnd = schedule.breakEnd ? this.timeToMinutes(schedule.breakEnd) : null;

      while (current + slotDuration <= end) {
        if (breakStart !== null && breakEnd !== null && current >= breakStart && current < breakEnd) {
          current += slotDuration;
          continue;
        }

        const startTime = this.minutesToTime(current);
        const endTime = this.minutesToTime(current + slotDuration);

        // Если это сегодня — скрыть слоты, до которых < 2 часов
        let available = !bookedTimes.has(startTime);
        if (available && requestedDate.getTime() === today.getTime()) {
          const slotTime = new Date(now);
          const [h, m] = startTime.split(':').map(Number);
          slotTime.setHours(h, m, 0, 0);
          const diffMs = slotTime.getTime() - now.getTime();
          if (diffMs < 2 * 60 * 60 * 1000) {
            available = false;
          }
        }

        slots.push({ startTime, endTime, available });
        current += slotDuration;
      }
    }

    return slots;
  }

  async createPublicAppointment(data: {
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    patientFirstName: string;
    patientLastName: string;
    patientPhone: string;
    patientEmail?: string;
    type?: string;
    notes?: string;
  }) {
    const requestedDate = new Date(data.date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Лимит: не более 14 дней вперёд
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 14);
    if (requestedDate > maxDate) {
      throw new BadRequestException('Нельзя записаться более чем на 14 дней вперёд');
    }

    // Лимит: минимум за 2 часа до приёма
    if (requestedDate.getTime() === today.getTime()) {
      const [h, m] = data.startTime.split(':').map(Number);
      const slotTime = new Date(now);
      slotTime.setHours(h, m, 0, 0);
      if (slotTime.getTime() - now.getTime() < 2 * 60 * 60 * 1000) {
        throw new BadRequestException('Запись возможна минимум за 2 часа до приёма');
      }
    }

    // Лимит: не более 3 активных записей на один номер телефона
    const existingPatient = await this.patientRepository.findOne({
      where: { phone: data.patientPhone },
    });

    if (existingPatient) {
      const activeBookings = await this.appointmentRepository.count({
        where: {
          patientId: existingPatient.id,
          status: In([
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.WAITING_CONFIRMATION,
          ]),
        },
      });
      if (activeBookings >= 3) {
        throw new BadRequestException('Превышен лимит активных записей (макс. 3). Дождитесь завершения текущих приёмов.');
      }
    }

    // Check for conflicts
    const existing = await this.appointmentRepository.findOne({
      where: {
        doctorId: data.doctorId,
        date: new Date(data.date),
        startTime: data.startTime,
        status: Not(AppointmentStatus.CANCELLED),
      },
    });

    if (existing) throw new ConflictException('Это время уже занято');

    // Find or create patient
    let patient = existingPatient;

    if (!patient) {
      patient = this.patientRepository.create({
        firstName: data.patientFirstName,
        lastName: data.patientLastName,
        phone: data.patientPhone,
        email: data.patientEmail || undefined,
        source: 'online',
      });
      patient = await this.patientRepository.save(patient);
    }

    const appointment = this.appointmentRepository.create({
      patientId: patient.id,
      doctorId: data.doctorId,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      type: (data.type as AppointmentType) || AppointmentType.PRIMARY,
      status: AppointmentStatus.WAITING_CONFIRMATION,
      source: AppointmentSource.ONLINE,
      notes: data.notes || null,
    });

    const saved = await this.appointmentRepository.save(appointment);

    return {
      id: saved.id,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'waiting_confirmation',
      message: 'Запись создана и ожидает подтверждения рецепшеном. Мы свяжемся с вами.',
    };
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}
