import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { User } from '../auth/entities/user.entity';
import { DoctorSchedule } from '../scheduling/entities/doctor-schedule.entity';
import { Appointment } from '../scheduling/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Service } from '../billing/entities/service.entity';
import { Department } from '../staff/entities/department.entity';
import { SystemSettings } from '../system/entities/system-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, DoctorSchedule, Appointment, Patient, Service, Department, SystemSettings])],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
