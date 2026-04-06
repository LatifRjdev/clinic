import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { Appointment } from './entities/appointment.entity';
import { AppointmentService } from './entities/appointment-service.entity';
import { Service } from '../billing/entities/service.entity';
import { User } from '../auth/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { BillingModule } from '../billing/billing.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { RoomsService } from './services/rooms.service';
import { SchedulesService } from './services/schedules.service';
import { AppointmentsService } from './services/appointments.service';
import { QueueService } from './services/queue.service';
import { RoomsController } from './controllers/rooms.controller';
import { SchedulesController } from './controllers/schedules.controller';
import { AppointmentsController } from './controllers/appointments.controller';
import { QueueController } from './controllers/queue.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, DoctorSchedule, Appointment, AppointmentService, Service, User, Patient]),
    BillingModule,
    InsuranceModule,
  ],
  controllers: [RoomsController, SchedulesController, AppointmentsController, QueueController],
  providers: [RoomsService, SchedulesService, AppointmentsService, QueueService],
  exports: [RoomsService, SchedulesService, AppointmentsService, QueueService],
})
export class SchedulingModule {}
