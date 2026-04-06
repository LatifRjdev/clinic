import { Injectable } from '@nestjs/common';
import PDFDocumentModule from 'pdfkit';
const PDFDocument = (PDFDocumentModule as any).default || PDFDocumentModule;

export interface InvoiceReceiptData {
  invoiceNumber: string;
  date: string;
  patientName: string;
  doctorName: string;
  clinicName: string;
  clinicAddress: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

export interface PrescriptionData {
  patientName: string;
  patientDob: string;
  doctorName: string;
  doctorSpecialty: string;
  clinicName: string;
  clinicAddress: string;
  date: string;
  diagnosis: string;
  diagnosisCode: string;
  medications: { name: string; dosage: string; frequency: string; duration: string; notes?: string }[];
}

@Injectable()
export class PdfService {
  async generateInvoiceReceipt(data: InvoiceReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(data.clinicName, { align: 'center' });
      doc.fontSize(10).text(data.clinicAddress, { align: 'center' });
      doc.moveDown();

      // Title
      doc.fontSize(16).text(`Чек №${data.invoiceNumber}`, { align: 'center' });
      doc.fontSize(10).text(`Дата: ${data.date}`, { align: 'center' });
      doc.moveDown();

      // Separator
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Patient & Doctor
      doc.fontSize(11)
        .text(`Пациент: ${data.patientName}`)
        .text(`Врач: ${data.doctorName}`);
      doc.moveDown();

      // Table header
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Услуга', 50, tableTop, { width: 250 });
      doc.text('Кол-во', 300, tableTop, { width: 50, align: 'center' });
      doc.text('Цена', 360, tableTop, { width: 80, align: 'right' });
      doc.text('Сумма', 450, tableTop, { width: 95, align: 'right' });

      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
      doc.moveDown(0.5);
      doc.font('Helvetica');

      // Items
      for (const item of data.items) {
        const y = doc.y;
        doc.text(item.name, 50, y, { width: 250 });
        doc.text(String(item.quantity), 300, y, { width: 50, align: 'center' });
        doc.text(`${item.price.toFixed(2)}`, 360, y, { width: 80, align: 'right' });
        doc.text(`${item.total.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
        doc.moveDown(0.3);
      }

      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
      doc.moveDown();

      // Totals
      doc.font('Helvetica');
      doc.text(`Подитого: ${data.subtotal.toFixed(2)} TJS`, { align: 'right' });
      if (data.discount > 0) {
        doc.text(`Скидка: -${data.discount.toFixed(2)} TJS`, { align: 'right' });
      }
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`ИТОГО: ${data.total.toFixed(2)} TJS`, { align: 'right' });
      doc.moveDown();
      doc.font('Helvetica').fontSize(10);
      doc.text(`Способ оплаты: ${data.paymentMethod}`, { align: 'right' });

      doc.moveDown(2);
      doc.fontSize(8).text('Спасибо за визит!', { align: 'center' });

      doc.end();
    });
  }

  async generatePrescription(data: PrescriptionData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).text(data.clinicName, { align: 'center' });
      doc.fontSize(9).text(data.clinicAddress, { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text('РЕЦЕПТ', { align: 'center' });
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Patient info
      doc.fontSize(11);
      doc.text(`Пациент: ${data.patientName}`);
      doc.text(`Дата рождения: ${data.patientDob}`);
      doc.text(`Дата: ${data.date}`);
      doc.moveDown();

      // Diagnosis
      doc.text(`Диагноз: ${data.diagnosis} (${data.diagnosisCode})`);
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Medications
      doc.fontSize(12).font('Helvetica-Bold').text('Назначения:');
      doc.font('Helvetica').fontSize(11);
      doc.moveDown(0.5);

      data.medications.forEach((med, i) => {
        doc.font('Helvetica-Bold').text(`${i + 1}. ${med.name}`);
        doc.font('Helvetica');
        doc.text(`   Дозировка: ${med.dosage}`);
        doc.text(`   Приём: ${med.frequency}`);
        doc.text(`   Длительность: ${med.duration}`);
        if (med.notes) doc.text(`   Примечание: ${med.notes}`);
        doc.moveDown(0.5);
      });

      doc.moveDown(2);

      // Signature
      doc.text(`Врач: ${data.doctorName}`, 50);
      doc.text(`Специальность: ${data.doctorSpecialty}`);
      doc.moveDown(2);
      doc.text('Подпись: __________________');

      doc.end();
    });
  }
}
