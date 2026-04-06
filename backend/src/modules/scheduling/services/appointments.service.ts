import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
} from '../entities/appointment.entity';
import { AppointmentService } from '../entities/appointment-service.entity';
import { Service } from '../../billing/entities/service.entity';
import { User } from '../../auth/entities/user.entity';
import { UserRole } from '../../../common/enums/roles.enum';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { InvoicesService } from '../../billing/services/invoices.service';
import { InvoiceStatus } from '../../billing/entities/invoice.entity';
import { InsuranceService } from '../../insurance/services/insurance.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { SearchAppointmentsDto } from '../dto/search-appointments.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepository: Repository<AppointmentService>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DoctorSchedule)
    private readonly scheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly invoicesService: InvoicesService,
    private readonly insuranceService: InsuranceService,
  ) {}

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    await this.checkConflict(dto.doctorId, dto.date, dto.startTime, dto.endTime);
    await this.checkDoctorSchedule(dto.doctorId, dto.date, dto.startTime, dto.endTime);

    const appointment = this.appointmentRepository.create(dto);

    // --- Insurance coverage verification (non-blocking) ---
    // If the patient has an insurance company on file, verify the policy against
    // the appointment date. A failed check never blocks booking — we only log
    // and append a note so reception/billing can follow up.
    try {
      const patient = await this.patientRepository.findOne({
        where: { id: dto.patientId },
      });
      if (patient?.insuranceCompanyId) {
        const appointmentDate =
          dto.date instanceof Date ? dto.date : new Date(dto.date);
        const result = await this.insuranceService.verifyPolicy(
          patient.insuranceCompanyId,
          patient.insurancePolicyNumber,
          appointmentDate,
        );
        if (!result.valid) {
          const warning = `[Страховка] ${result.reason ?? 'Полис не прошёл проверку'}`;
          this.logger.warn(
            `Insurance coverage invalid for patient ${patient.id} (company ${patient.insuranceCompanyId}): ${result.reason}`,
          );
          appointment.notes = appointment.notes
            ? `${appointment.notes}\n${warning}`
            : warning;
        } else {
          this.logger.log(
            `Insurance coverage verified for patient ${patient.id} (discount ${result.discountPercent}%)`,
          );
        }
      }
    } catch (error) {
      // Never block booking on coverage-check failures — log and continue.
      this.logger.error(
        `Insurance verification failed for patient ${dto.patientId}: ${error.message}`,
        error.stack,
      );
    }

    return this.appointmentRepository.save(appointment);
  }

  async findAll(
    query: SearchAppointmentsDto,
  ): Promise<{ data: Appointment[]; total: number }> {
    const {
      doctorId,
      patientId,
      dateFrom,
      dateTo,
      status,
      type,
      page = 1,
      limit = 20,
    } = query;

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('appointment.room', 'room');

    if (doctorId) {
      qb.andWhere('appointment.doctor_id = :doctorId', { doctorId });
    }

    if (patientId) {
      qb.andWhere('appointment.patient_id = :patientId', { patientId });
    }

    if (dateFrom) {
      qb.andWhere('appointment.date >= :dateFrom', {
        dateFrom: dateFrom instanceof Date
          ? dateFrom.toISOString().split('T')[0]
          : dateFrom,
      });
    }

    if (dateTo) {
      qb.andWhere('appointment.date <= :dateTo', {
        dateTo: dateTo instanceof Date
          ? dateTo.toISOString().split('T')[0]
          : dateTo,
      });
    }

    if (status) {
      qb.andWhere('appointment.status = :status', { status });
    }

    if (type) {
      qb.andWhere('appointment.type = :type', { type });
    }

    if (query.branchId) {
      qb.andWhere('appointment.branch_id = :branchId', { branchId: query.branchId });
    }

    qb.orderBy('appointment.date', 'ASC')
      .addOrderBy('appointment.startTime', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'room'],
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (dto.startTime || dto.endTime || dto.date || dto.doctorId) {
      const checkDoctorId = dto.doctorId || appointment.doctorId;
      const checkDate = dto.date || appointment.date;
      const checkStart = dto.startTime || appointment.startTime;
      const checkEnd = dto.endTime || appointment.endTime;

      if (checkStart >= checkEnd) {
        throw new BadRequestException('End time must be after start time');
      }

      await this.checkConflict(checkDoctorId, checkDate, checkStart, checkEnd, id);
      await this.checkDoctorSchedule(checkDoctorId, checkDate, checkStart, checkEnd);
    }

    Object.assign(appointment, dto);
    return this.appointmentRepository.save(appointment);
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.softRemove(appointment);
  }

  // --- Bulk operations ---

  async bulkCancel(
    appointmentIds: string[],
    reason?: string,
  ): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of appointmentIds) {
      try {
        await this.changeStatus(id, AppointmentStatus.CANCELLED, reason);
        success.push(id);
      } catch (error) {
        failed.push({ id, error: error.message });
      }
    }

    return { success, failed };
  }

  async bulkReschedule(
    appointmentIds: string[],
    newDate: string,
  ): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];
    const dateObj = new Date(newDate);

    for (const id of appointmentIds) {
      try {
        const appointment = await this.findOne(id);
        await this.reschedule(
          id,
          dateObj,
          appointment.startTime,
          appointment.endTime,
        );
        success.push(id);
      } catch (error) {
        failed.push({ id, error: error.message });
      }
    }

    return { success, failed };
  }

  async bulkChangeStatus(
    appointmentIds: string[],
    status: AppointmentStatus,
  ): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of appointmentIds) {
      try {
        await this.changeStatus(id, status);
        success.push(id);
      } catch (error) {
        failed.push({ id, error: error.message });
      }
    }

    return { success, failed };
  }

  // --- Today's appointments ---

  async findToday(doctorId?: string, branchId?: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('appointment.room', 'room')
      .where('appointment.date = :today', { today });

    if (doctorId) {
      qb.andWhere('appointment.doctor_id = :doctorId', { doctorId });
    }

    if (branchId) {
      qb.andWhere('appointment.branch_id = :branchId', { branchId });
    }

    qb.orderBy('appointment.start_time', 'ASC');

    return qb.getMany();
  }

  // --- Confirm appointment ---

  async confirm(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (
      appointment.status !== AppointmentStatus.SCHEDULED &&
      appointment.status !== AppointmentStatus.WAITING_CONFIRMATION
    ) {
      throw new BadRequestException(
        `Нельзя подтвердить запись со статусом "${appointment.status}"`,
      );
    }

    appointment.status = AppointmentStatus.CONFIRMED;
    return this.appointmentRepository.save(appointment);
  }

  // --- Reschedule appointment ---

  async reschedule(
    id: string,
    date: Date,
    startTime: string,
    endTime: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot reschedule appointment with status "${appointment.status}"`,
      );
    }

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    await this.checkConflict(appointment.doctorId, date, startTime, endTime, id);
    await this.checkDoctorSchedule(appointment.doctorId, date, startTime, endTime);

    appointment.date = date;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.status = AppointmentStatus.SCHEDULED;

    return this.appointmentRepository.save(appointment);
  }

  // --- Change status ---

  private static readonly VALID_TRANSITIONS: Record<string, string[]> = {
    [AppointmentStatus.SCHEDULED]: [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
    ],
    [AppointmentStatus.WAITING_CONFIRMATION]: [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
    ],
    [AppointmentStatus.CONFIRMED]: [
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
      AppointmentStatus.SCHEDULED, // allow un-confirm
    ],
    [AppointmentStatus.IN_PROGRESS]: [
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
    ],
    [AppointmentStatus.COMPLETED]: [],
    [AppointmentStatus.CANCELLED]: [],
    [AppointmentStatus.NO_SHOW]: [
      AppointmentStatus.SCHEDULED, // allow re-scheduling
    ],
  };

  async changeStatus(
    id: string,
    status: AppointmentStatus,
    cancellationReason?: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    const allowed =
      AppointmentsService.VALID_TRANSITIONS[appointment.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Нельзя перевести запись из "${appointment.status}" в "${status}"`,
      );
    }

    if (
      status === AppointmentStatus.CANCELLED &&
      !cancellationReason
    ) {
      throw new BadRequestException('Укажите причину отмены');
    }

    appointment.status = status;
    if (cancellationReason) {
      appointment.cancellationReason = cancellationReason;
    }

    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Auto-create draft invoice when appointment is completed
    if (status === AppointmentStatus.COMPLETED) {
      await this.createDraftInvoice(savedAppointment);
    }

    return savedAppointment;
  }

  // --- Auto-invoice on completion ---

  private async createDraftInvoice(appointment: Appointment): Promise<void> {
    try {
      // Gather services rendered during the appointment
      const renderedServices = await this.appointmentServiceRepository.find({
        where: { appointmentId: appointment.id },
      });

      // Build invoice items from rendered services, or fall back to the appointment's primary service
      const items: { serviceId: string; quantity: number; discountPercent: number }[] = [];

      if (renderedServices.length > 0) {
        for (const rs of renderedServices) {
          items.push({
            serviceId: rs.serviceId,
            quantity: rs.quantity,
            discountPercent: 0,
          });
        }
      } else if (appointment.serviceId) {
        items.push({
          serviceId: appointment.serviceId,
          quantity: 1,
          discountPercent: 0,
        });
      }

      if (items.length === 0) {
        this.logger.warn(
          `No services found for appointment ${appointment.id} — skipping auto-invoice`,
        );
        return;
      }

      await this.invoicesService.create({
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        status: InvoiceStatus.DRAFT,
        notes: `Автоматически создано при завершении приёма ${appointment.id}`,
        items,
      });

      this.logger.log(
        `Draft invoice created for completed appointment ${appointment.id}`,
      );
    } catch (error) {
      // Log but do not fail the status change — invoice can be created manually
      this.logger.error(
        `Failed to auto-create invoice for appointment ${appointment.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  // --- Check conflicts for a time range ---

  async findConflicts(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<Appointment[]> {
    return this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .where('appointment.doctor_id = :doctorId', { doctorId })
      .andWhere('appointment.date = :date', { date })
      .andWhere('appointment.status != :cancelledStatus', {
        cancelledStatus: AppointmentStatus.CANCELLED,
      })
      .andWhere(
        '(appointment.start_time < :endTime AND appointment.end_time > :startTime)',
        { startTime, endTime },
      )
      .getMany();
  }

  // --- Appointment services (rendered) ---

  async addServices(
    appointmentId: string,
    items: { serviceId: string; quantity: number; notes?: string }[],
    recordedBy: string,
  ): Promise<AppointmentService[]> {
    await this.findOne(appointmentId);

    const entities: AppointmentService[] = [];
    for (const item of items) {
      const service = await this.serviceRepository.findOne({ where: { id: item.serviceId } });
      if (!service) {
        throw new NotFoundException(`Service with ID "${item.serviceId}" not found`);
      }
      entities.push(
        this.appointmentServiceRepository.create({
          appointmentId,
          serviceId: item.serviceId,
          quantity: item.quantity || 1,
          unitPrice: service.price,
          notes: item.notes || null,
          recordedBy,
        }),
      );
    }
    return this.appointmentServiceRepository.save(entities);
  }

  async getServices(appointmentId: string): Promise<AppointmentService[]> {
    return this.appointmentServiceRepository.find({
      where: { appointmentId },
      order: { createdAt: 'ASC' },
    });
  }

  async removeService(appointmentId: string, serviceRecordId: string): Promise<void> {
    const record = await this.appointmentServiceRepository.findOne({
      where: { id: serviceRecordId, appointmentId },
    });
    if (!record) {
      throw new NotFoundException('Запись об услуге не найдена');
    }
    await this.appointmentServiceRepository.remove(record);
  }

  // --- Staff (doctors) ---

  async getDoctors(): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'middleName' | 'role'>[]> {
    return this.userRepository.find({
      where: [
        { role: UserRole.DOCTOR, isActive: true },
        { role: UserRole.CHIEF_DOCTOR, isActive: true },
      ],
      select: ['id', 'firstName', 'lastName', 'middleName', 'role'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  // --- Private helpers ---

  private async checkDoctorSchedule(
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ): Promise<void> {
    const dateObj = date instanceof Date ? date : new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday

    const schedule = await this.scheduleRepository.findOne({
      where: { doctorId, dayOfWeek, isActive: true },
    });

    if (!schedule) {
      throw new BadRequestException(
        `Врач не работает в этот день недели`,
      );
    }

    if (startTime < schedule.startTime || endTime > schedule.endTime) {
      throw new BadRequestException(
        `Время приёма (${startTime}–${endTime}) выходит за рамки расписания врача (${schedule.startTime}–${schedule.endTime})`,
      );
    }

    if (
      schedule.breakStart && schedule.breakEnd &&
      startTime < schedule.breakEnd && endTime > schedule.breakStart
    ) {
      throw new BadRequestException(
        `Время приёма пересекается с перерывом врача (${schedule.breakStart}–${schedule.breakEnd})`,
      );
    }
  }

  private async checkConflict(
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<void> {
    const dateStr =
      date instanceof Date ? date.toISOString().split('T')[0] : date;

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctor_id = :doctorId', { doctorId })
      .andWhere('appointment.date = :date', { date: dateStr })
      .andWhere('appointment.status != :cancelledStatus', {
        cancelledStatus: AppointmentStatus.CANCELLED,
      })
      .andWhere(
        '(appointment.start_time < :endTime AND appointment.end_time > :startTime)',
        { startTime, endTime },
      );

    if (excludeId) {
      qb.andWhere('appointment.id != :excludeId', { excludeId });
    }

    const conflict = await qb.getOne();

    if (conflict) {
      throw new ConflictException(
        `Doctor already has an appointment from ${conflict.startTime} to ${conflict.endTime} on this date`,
      );
    }
  }
}
