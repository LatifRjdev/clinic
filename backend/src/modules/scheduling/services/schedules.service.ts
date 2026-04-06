import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { CreateDoctorScheduleDto } from '../dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from '../dto/update-doctor-schedule.dto';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly scheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async create(dto: CreateDoctorScheduleDto): Promise<DoctorSchedule> {
    const schedule = this.scheduleRepository.create(dto);
    return this.scheduleRepository.save(schedule);
  }

  async findAll(branchId?: string): Promise<DoctorSchedule[]> {
    const qb = this.scheduleRepository.createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.doctor', 'doctor')
      .leftJoinAndSelect('schedule.room', 'room');
    if (branchId) {
      qb.andWhere('schedule.branch_id = :branchId', { branchId });
    }
    return qb.orderBy('schedule.day_of_week', 'ASC').addOrderBy('schedule.start_time', 'ASC').getMany();
  }

  async findByDoctor(doctorId: string): Promise<DoctorSchedule[]> {
    return this.scheduleRepository.find({
      where: { doctorId, isActive: true },
      relations: ['room'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<DoctorSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['doctor', 'room'],
    });
    if (!schedule) {
      throw new NotFoundException(`Doctor schedule with id ${id} not found`);
    }
    return schedule;
  }

  async update(
    id: string,
    dto: UpdateDoctorScheduleDto,
  ): Promise<DoctorSchedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);
    return this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.softRemove(schedule);
  }

  async getAvailableSlots(
    doctorId: string,
    date: Date,
  ): Promise<TimeSlot[]> {
    const dayOfWeek = date.getDay();

    const schedules = await this.scheduleRepository.find({
      where: { doctorId, dayOfWeek, isActive: true },
    });

    if (schedules.length === 0) {
      return [];
    }

    // Get non-cancelled appointments for this doctor on this date
    const bookedAppointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctor_id = :doctorId', { doctorId })
      .andWhere('appointment.date = :date', {
        date: date.toISOString().split('T')[0],
      })
      .andWhere('appointment.status != :cancelledStatus', {
        cancelledStatus: AppointmentStatus.CANCELLED,
      })
      .getMany();

    const slots: TimeSlot[] = [];

    for (const schedule of schedules) {
      const slotDuration = schedule.slotDuration;
      let currentMinutes = this.timeToMinutes(schedule.startTime);
      const endMinutes = this.timeToMinutes(schedule.endTime);
      const breakStartMinutes = schedule.breakStart
        ? this.timeToMinutes(schedule.breakStart)
        : null;
      const breakEndMinutes = schedule.breakEnd
        ? this.timeToMinutes(schedule.breakEnd)
        : null;

      while (currentMinutes + slotDuration <= endMinutes) {
        const slotStart = this.minutesToTime(currentMinutes);
        const slotEnd = this.minutesToTime(currentMinutes + slotDuration);

        // Skip slots during break
        if (
          breakStartMinutes !== null &&
          breakEndMinutes !== null &&
          currentMinutes < breakEndMinutes &&
          currentMinutes + slotDuration > breakStartMinutes
        ) {
          currentMinutes = breakEndMinutes;
          continue;
        }

        // Check if slot is booked
        const isBooked = bookedAppointments.some((appt) => {
          const apptStart = this.timeToMinutes(appt.startTime);
          const apptEnd = this.timeToMinutes(appt.endTime);
          return currentMinutes < apptEnd && currentMinutes + slotDuration > apptStart;
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: !isBooked,
        });

        currentMinutes += slotDuration;
      }
    }

    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}
