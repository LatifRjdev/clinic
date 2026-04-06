import { Controller, Get, Param, Res, UseGuards, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfService, InvoiceReceiptData, PrescriptionData } from './pdf.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../billing/entities/invoice.entity';
import { InvoiceItem } from '../billing/entities/invoice-item.entity';
import { Prescription } from '../emr/entities/prescription.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';

@ApiTags('PDF')
@Controller('pdf')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get('invoice/:id')
  @ApiOperation({ summary: 'Generate invoice receipt PDF' })
  async invoiceReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!invoice) throw new NotFoundException('Счёт не найден');

    const patient = await this.patientRepository.findOne({ where: { id: invoice.patientId } });
    const items = invoice.items || [];

    const data: InvoiceReceiptData = {
      invoiceNumber: invoice.invoiceNumber || id.slice(0, 8).toUpperCase(),
      date: new Date(invoice.createdAt).toLocaleDateString('ru-RU'),
      patientName: patient ? `${patient.lastName} ${patient.firstName}` : 'Не указан',
      doctorName: '',
      clinicName: 'MedClinic',
      clinicAddress: 'г. Душанбе, ул. Рудаки 123',
      items: items.map((item: InvoiceItem) => ({
        name: item.service?.name || 'Услуга',
        quantity: item.quantity || 1,
        price: Number(item.unitPrice) || 0,
        total: Number(item.amount) || 0,
      })),
      subtotal: Number(invoice.totalAmount) || 0,
      discount: Number(invoice.discountAmount) || 0,
      total: Number(invoice.finalAmount) || 0,
      paymentMethod: 'Наличные',
    };

    const buffer = await this.pdfService.generateInvoiceReceipt(data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=receipt-${data.invoiceNumber}.pdf`);
    res.send(buffer);
  }

  @Get('prescription/:id')
  @ApiOperation({ summary: 'Generate prescription PDF' })
  async prescription(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const rx = await this.prescriptionRepository.findOne({ where: { id } });
    if (!rx) throw new NotFoundException('Рецепт не найден');

    const patient = await this.patientRepository.findOne({ where: { id: rx.patientId } });
    const doctor = await this.userRepository.findOne({ where: { id: rx.doctorId } });

    const data: PrescriptionData = {
      patientName: patient
        ? `${patient.lastName} ${patient.firstName} ${patient.middleName || ''}`
        : 'Не указан',
      patientDob: patient?.dateOfBirth
        ? new Date(patient.dateOfBirth).toLocaleDateString('ru-RU')
        : '',
      doctorName: doctor ? `${doctor.lastName} ${doctor.firstName}` : 'Не указан',
      doctorSpecialty: doctor?.specialty || '',
      clinicName: 'MedClinic',
      clinicAddress: 'г. Душанбе, ул. Рудаки 123',
      date: new Date(rx.createdAt).toLocaleDateString('ru-RU'),
      diagnosis: '',
      diagnosisCode: '',
      medications: [{
        name: rx.medicationName,
        dosage: rx.dosage,
        frequency: rx.frequency,
        duration: rx.duration || '',
        notes: rx.instructions || '',
      }],
    };

    const buffer = await this.pdfService.generatePrescription(data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=prescription-${id.slice(0, 8)}.pdf`);
    res.send(buffer);
  }
}
