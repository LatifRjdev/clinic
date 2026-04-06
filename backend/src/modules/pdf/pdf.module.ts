import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { Invoice } from '../billing/entities/invoice.entity';
import { Prescription } from '../emr/entities/prescription.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Prescription, Patient, User])],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
