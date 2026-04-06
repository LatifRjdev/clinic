import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientDto } from './dto/search-patient.dto';
import { PaginatedPatientsResponseDto } from './dto/patient-response.dto';
import { Appointment } from '../scheduling/entities/appointment.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly storageService: StorageService,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    if (!createPatientDto.medicalRecordNumber) {
      createPatientDto.medicalRecordNumber = await this.generateMedicalRecordNumber();
    }
    const patient = this.patientRepository.create(createPatientDto);
    return this.patientRepository.save(patient);
  }

  private async generateMedicalRecordNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `MRN-${dateStr}-`;

    const lastPatient = await this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.medicalRecordNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('patient.medicalRecordNumber', 'DESC')
      .getOne();

    let seq = 1;
    if (lastPatient?.medicalRecordNumber) {
      const lastSeq = parseInt(lastPatient.medicalRecordNumber.slice(prefix.length), 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  async findAll(
    searchDto: SearchPatientDto,
  ): Promise<PaginatedPatientsResponseDto> {
    const { query, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', branchId } = searchDto;

    const qb = this.patientRepository.createQueryBuilder('patient');

    if (branchId) {
      qb.andWhere('patient.branchId = :branchId', { branchId });
    }

    if (query) {
      const searchTerm = `%${query}%`;
      qb.where(
        new Brackets((bracket) => {
          bracket
            .where('patient.firstName ILIKE :searchTerm', { searchTerm })
            .orWhere('patient.lastName ILIKE :searchTerm', { searchTerm })
            .orWhere('patient.phone ILIKE :searchTerm', { searchTerm })
            .orWhere('patient.email ILIKE :searchTerm', { searchTerm });
        }),
      );
    }

    qb.orderBy(`patient.${sortBy}`, sortOrder);
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID "${id}" not found`);
    }
    return patient;
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<Patient> {
    const patient = await this.findOne(id);
    Object.assign(patient, updatePatientDto);
    return this.patientRepository.save(patient);
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepository.softRemove(patient);
  }

  // --- Autocomplete search ---

  async search(query: string): Promise<Patient[]> {
    if (!query || query.length < 2) return [];

    const searchTerm = `%${query}%`;
    return this.patientRepository
      .createQueryBuilder('patient')
      .where(
        new Brackets((bracket) => {
          bracket
            .where('patient.firstName ILIKE :searchTerm', { searchTerm })
            .orWhere('patient.lastName ILIKE :searchTerm', { searchTerm })
            .orWhere('patient.phone ILIKE :searchTerm', { searchTerm })
            .orWhere('patient.passportNumber ILIKE :searchTerm', { searchTerm });
        }),
      )
      .orderBy('patient.lastName', 'ASC')
      .take(10)
      .getMany();
  }

  // --- Patient visit history ---

  async getHistory(patientId: string): Promise<Appointment[]> {
    await this.findOne(patientId); // verify patient exists

    return this.appointmentRepository.find({
      where: { patientId },
      relations: ['doctor', 'room'],
      order: { date: 'DESC', startTime: 'DESC' },
    });
  }

  // --- Patient timeline (visits + records combined) ---

  async getTimeline(
    patientId: string,
  ): Promise<{ type: string; date: string; data: any }[]> {
    await this.findOne(patientId);

    const appointments = await this.appointmentRepository.find({
      where: { patientId },
      relations: ['doctor'],
      order: { date: 'DESC' },
    });

    const timeline = appointments.map((apt) => ({
      type: 'appointment',
      date: apt.date instanceof Date ? apt.date.toISOString() : String(apt.date),
      data: {
        id: apt.id,
        doctorId: apt.doctorId,
        doctorName: apt.doctor
          ? `${apt.doctor.lastName} ${apt.doctor.firstName}`
          : null,
        type: apt.type,
        status: apt.status,
        startTime: apt.startTime,
        endTime: apt.endTime,
      },
    }));

    return timeline.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  // --- Record consent ---

  async recordConsent(
    patientId: string,
    consentGiven: boolean,
  ): Promise<Patient> {
    const patient = await this.findOne(patientId);
    patient.consentGiven = consentGiven;
    patient.consentDate = consentGiven ? new Date() : null;
    return this.patientRepository.save(patient);
  }

  // --- Photo upload ---

  async uploadPhoto(patientId: string, file: Express.Multer.File): Promise<Patient> {
    const patient = await this.findOne(patientId);

    if (patient.photoUrl) {
      try { await this.storageService.delete(patient.photoUrl); } catch {}
    }

    const result = await this.storageService.upload(file, 'patients/photos');
    patient.photoUrl = result.key;
    return this.patientRepository.save(patient);
  }

  // --- Export CSV ---

  async exportCsv(): Promise<string> {
    const patients = await this.patientRepository.find({ order: { lastName: 'ASC' } });

    const headers = ['Фамилия', 'Имя', 'Отчество', 'Дата рождения', 'Пол', 'Телефон', 'Email', 'Адрес', 'Паспорт', 'Группа крови', 'Аллергии', 'Источник'];
    const rows = patients.map((p) => [
      p.lastName, p.firstName, p.middleName || '',
      p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('ru-RU') : '',
      p.gender || '', p.phone || '', p.email || '', p.address || '',
      p.passportNumber || '', p.bloodType || '', p.allergies || '', p.source || '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  // --- Import CSV ---

  async importCsv(
    csvContent: string,
    mode: 'skip' | 'update' | 'create-anyway' = 'skip',
  ): Promise<{
    created: number;
    updated: number;
    skipped: number;
    errors: { row: number; message: string }[];
    duplicates: { row: number; existingPatientId: string }[];
  }> {
    const lines = csvContent.split('\n').filter((l) => l.trim());
    if (lines.length < 2) throw new BadRequestException('CSV файл пустой или содержит только заголовки');

    const errors: { row: number; message: string }[] = [];
    const duplicates: { row: number; existingPatientId: string }[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      try {
        const cols = this.parseCsvLine(lines[i]);
        if (cols.length < 6) {
          errors.push({ row: rowNum, message: 'недостаточно колонок' });
          continue;
        }

        const data = {
          lastName: cols[0],
          firstName: cols[1],
          middleName: cols[2] || undefined,
          dateOfBirth: cols[3] ? new Date(cols[3].split('.').reverse().join('-')) : undefined,
          gender: (cols[4] as any) || undefined,
          phone: cols[5] || undefined,
          email: cols[6] || undefined,
          address: cols[7] || undefined,
          passportNumber: cols[8] || undefined,
          bloodType: cols[9] || undefined,
          allergies: cols[10] || undefined,
          source: cols[11] || 'import',
        };

        // Look for duplicates: same phone OR (firstName + lastName + birthDate)
        const existing = await this.findDuplicate(
          data.phone,
          data.firstName,
          data.lastName,
          data.dateOfBirth,
        );

        if (existing) {
          duplicates.push({ row: rowNum, existingPatientId: existing.id });

          if (mode === 'skip') {
            skipped++;
            continue;
          }

          if (mode === 'update') {
            Object.assign(existing, {
              ...data,
              // Don't overwrite with empty values
              middleName: data.middleName ?? existing.middleName,
              dateOfBirth: data.dateOfBirth ?? existing.dateOfBirth,
              gender: data.gender ?? existing.gender,
              phone: data.phone ?? existing.phone,
              email: data.email ?? existing.email,
              address: data.address ?? existing.address,
              passportNumber: data.passportNumber ?? existing.passportNumber,
              bloodType: data.bloodType ?? existing.bloodType,
              allergies: data.allergies ?? existing.allergies,
            });
            await this.patientRepository.save(existing);
            updated++;
            continue;
          }
          // 'create-anyway' falls through to create
        }

        const patient = this.patientRepository.create(data);
        await this.patientRepository.save(patient);
        created++;
      } catch (err) {
        errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : 'ошибка',
        });
      }
    }

    return { created, updated, skipped, errors, duplicates };
  }

  private async findDuplicate(
    phone: string | undefined,
    firstName: string,
    lastName: string,
    dateOfBirth: Date | undefined,
  ): Promise<Patient | null> {
    const qb = this.patientRepository.createQueryBuilder('patient');
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (phone) {
      conditions.push('patient.phone = :phone');
      params.phone = phone;
    }

    if (firstName && lastName && dateOfBirth) {
      conditions.push(
        '(patient.firstName = :firstName AND patient.lastName = :lastName AND patient.dateOfBirth = :dateOfBirth)',
      );
      params.firstName = firstName;
      params.lastName = lastName;
      params.dateOfBirth = dateOfBirth;
    }

    if (conditions.length === 0) return null;

    return qb.where(conditions.join(' OR '), params).getOne();
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  // --- Merge duplicates ---

  async merge(primaryId: string, duplicateIds: string[]): Promise<Patient> {
    const primary = await this.findOne(primaryId);
    const duplicates = await this.patientRepository.find({ where: { id: In(duplicateIds) } });

    if (duplicates.length === 0) throw new BadRequestException('Дубликаты не найдены');

    // Transfer appointments from duplicates to primary
    for (const dup of duplicates) {
      await this.appointmentRepository.update({ patientId: dup.id }, { patientId: primaryId });

      // Fill empty fields from duplicates
      if (!primary.phone && dup.phone) primary.phone = dup.phone;
      if (!primary.email && dup.email) primary.email = dup.email;
      if (!primary.address && dup.address) primary.address = dup.address;
      if (!primary.passportNumber && dup.passportNumber) primary.passportNumber = dup.passportNumber;
      if (!primary.bloodType && dup.bloodType) primary.bloodType = dup.bloodType;
      if (!primary.allergies && dup.allergies) primary.allergies = dup.allergies;

      await this.patientRepository.softRemove(dup);
    }

    return this.patientRepository.save(primary);
  }
}
