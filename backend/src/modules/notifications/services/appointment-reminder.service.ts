import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Appointment,
  AppointmentStatus,
} from '../../scheduling/entities/appointment.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../auth/entities/user.entity';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../entities/notification.entity';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger(AppointmentReminderService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Runs every 15 minutes. Finds appointments in the upcoming 24h and 2h
   * windows that haven't had reminders sent yet, sends SMS/email, and marks
   * them as reminded.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleAppointmentReminders(): Promise<void> {
    this.logger.log('Running appointment reminder check...');

    const now = new Date();

    // 24-hour window: appointments between 23h and 25h from now
    const from24h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const to24h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // 2-hour window: appointments between 1.5h and 2.5h from now
    const from2h = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);
    const to2h = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    const activeStatuses = [
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.WAITING_CONFIRMATION,
    ];

    // Query appointments in both windows that haven't been reminded.
    // The date column is a DATE (no time), so we compare date-only strings
    // via a raw query builder to avoid TypeORM type mismatch.
    const appointments = await this.appointmentRepository
      .createQueryBuilder('appt')
      .leftJoinAndSelect('appt.patient', 'patient')
      .leftJoinAndSelect('appt.doctor', 'doctor')
      .where('appt.reminderSent = :reminded', { reminded: false })
      .andWhere('appt.status IN (:...statuses)', { statuses: activeStatuses })
      .andWhere(
        '((appt.date BETWEEN :from24h AND :to24h) OR (appt.date BETWEEN :from2h AND :to2h))',
        {
          from24h: this.toDateOnly(from24h),
          to24h: this.toDateOnly(to24h),
          from2h: this.toDateOnly(from2h),
          to2h: this.toDateOnly(to2h),
        },
      )
      .getMany();

    if (appointments.length === 0) {
      this.logger.debug('No appointments need reminders right now');
      return;
    }

    this.logger.log(
      `Found ${appointments.length} appointment(s) needing reminders`,
    );

    for (const appointment of appointments) {
      try {
        await this.sendReminder(appointment);
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for appointment ${appointment.id}: ${error.message}`,
        );
      }
    }
  }

  private async sendReminder(appointment: Appointment): Promise<void> {
    // Load patient if not already loaded via relation
    const patient =
      appointment.patient ??
      (await this.patientRepository.findOne({
        where: { id: appointment.patientId },
      }));

    const doctor =
      appointment.doctor ??
      (await this.userRepository.findOne({
        where: { id: appointment.doctorId },
      }));

    if (!patient) {
      this.logger.warn(
        `Patient not found for appointment ${appointment.id}, skipping`,
      );
      return;
    }

    const doctorName = doctor
      ? `${doctor.lastName} ${doctor.firstName}`
      : 'врач';
    const dateStr = appointment.date.toString().slice(0, 10);
    const timeStr = appointment.startTime;

    const smsText =
      `Напоминание: ваш приём назначен на ${dateStr} в ${timeStr}. ` +
      `Врач: ${doctorName}. МедКлиник`;

    const emailSubject = 'Напоминание о приёме — МедКлиник';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Напоминание о приёме</h2>
        <p>Уважаемый(ая) ${patient.lastName} ${patient.firstName},</p>
        <p>Напоминаем о вашем приёме:</p>
        <ul>
          <li><strong>Дата:</strong> ${dateStr}</li>
          <li><strong>Время:</strong> ${timeStr}</li>
          <li><strong>Врач:</strong> ${doctorName}</li>
        </ul>
        <p>Пожалуйста, приходите за 10-15 минут до назначенного времени.</p>
        <p>Если вы не можете прийти, пожалуйста, отмените запись заранее.</p>
        <br/>
        <p style="color: #888; font-size: 12px;">МедКлиник</p>
      </div>
    `;

    // Send SMS if patient has a phone number
    if (patient.phone) {
      await this.smsService.sendSms(patient.phone, smsText);
    }

    // Send email if patient has an email address
    if (patient.email) {
      await this.emailService.sendEmail(patient.email, emailSubject, emailHtml);
    }

    // Create an in-app notification for the patient's user account if available
    try {
      await this.notificationsService.create({
        userId: appointment.patientId,
        type: NotificationType.APPOINTMENT,
        title: 'Напоминание о приёме',
        body: smsText,
        link: `/appointments/${appointment.id}`,
        metadata: { appointmentId: appointment.id },
      });
    } catch {
      // Patient may not have a user account — that's OK
    }

    // Mark reminder as sent
    appointment.reminderSent = true;
    await this.appointmentRepository.save(appointment);

    this.logger.log(
      `Reminder sent for appointment ${appointment.id} (patient: ${patient.lastName})`,
    );
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
