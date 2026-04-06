import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../billing/entities/invoice.entity';
import { Appointment } from '../scheduling/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Appointment, Patient, User, Review])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
