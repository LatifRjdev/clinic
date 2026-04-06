import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification } from './entities/notification.entity';
import { NotificationSettings } from './entities/notification-settings.entity';
import { Appointment } from '../scheduling/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { AppointmentReminderService } from './services/appointment-reminder.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationSettings,
      Appointment,
      Patient,
      User,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationsService,
    EmailService,
    SmsService,
    AppointmentReminderService,
  ],
  exports: [NotificationsService, EmailService, SmsService],
})
export class NotificationsModule {}
