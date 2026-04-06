import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async getQueue(date?: string, branchId?: string, doctorId?: string) {
    const today = date || new Date().toISOString().split('T')[0];

    const qb = this.appointmentRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .leftJoinAndSelect('a.room', 'room')
      .where('a.date = :today', { today })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS],
      })
      .orderBy('a.queue_position', 'ASC', 'NULLS LAST')
      .addOrderBy('a.start_time', 'ASC');

    if (branchId) qb.andWhere('a.branch_id = :branchId', { branchId });
    if (doctorId) qb.andWhere('a.doctor_id = :doctorId', { doctorId });

    const appointments = await qb.getMany();

    return {
      data: appointments,
      total: appointments.length,
      inProgress: appointments.filter((a) => a.status === AppointmentStatus.IN_PROGRESS).length,
      waiting: appointments.filter((a) => a.status !== AppointmentStatus.IN_PROGRESS).length,
    };
  }

  async callNext(doctorId: string, branchId?: string): Promise<Appointment> {
    const today = new Date().toISOString().split('T')[0];

    const qb = this.appointmentRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('a.room', 'room')
      .where('a.date = :today', { today })
      .andWhere('a.doctor_id = :doctorId', { doctorId })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.SCHEDULED],
      })
      .orderBy('a.queue_position', 'ASC', 'NULLS LAST')
      .addOrderBy('a.start_time', 'ASC');

    if (branchId) qb.andWhere('a.branch_id = :branchId', { branchId });

    const next = await qb.getOne();
    if (!next) throw new NotFoundException('Нет пациентов в очереди');

    next.status = AppointmentStatus.IN_PROGRESS;
    return this.appointmentRepository.save(next);
  }

  async updateQueueStatus(
    appointmentId: string,
    status: 'completed' | 'no_show' | 'cancelled',
  ): Promise<Appointment> {
    const apt = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'doctor'],
    });
    if (!apt) throw new NotFoundException('Запись не найдена');

    const statusMap: Record<string, AppointmentStatus> = {
      completed: AppointmentStatus.COMPLETED,
      no_show: AppointmentStatus.NO_SHOW,
      cancelled: AppointmentStatus.CANCELLED,
    };

    if (!statusMap[status]) throw new BadRequestException('Неверный статус');

    apt.status = statusMap[status];
    return this.appointmentRepository.save(apt);
  }

  async assignPosition(appointmentId: string, position: number): Promise<Appointment> {
    const apt = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
    if (!apt) throw new NotFoundException('Запись не найдена');
    apt.queuePosition = position;
    return this.appointmentRepository.save(apt);
  }
}
