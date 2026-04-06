import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { MedicalRecord, MedicalRecordStatus } from '../entities/medical-record.entity';
import { CreateMedicalRecordDto } from '../dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from '../dto/update-medical-record.dto';
import { AmendMedicalRecordDto } from '../dto/amend-medical-record.dto';
import { SearchMedicalRecordDto } from '../dto/search-medical-record.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateMedicalRecordDto): Promise<MedicalRecord> {
    const record = this.medicalRecordRepository.create(dto);
    return this.medicalRecordRepository.save(record);
  }

  async findAll(searchDto: SearchMedicalRecordDto) {
    const {
      patientId,
      doctorId,
      appointmentId,
      branchId,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.medicalRecordRepository.createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('record.doctor', 'doctor');

    if (patientId) {
      qb.andWhere('record.patientId = :patientId', { patientId });
    }

    if (doctorId) {
      qb.andWhere('record.doctorId = :doctorId', { doctorId });
    }

    if (appointmentId) {
      qb.andWhere('record.appointmentId = :appointmentId', { appointmentId });
    }

    if (branchId) {
      qb.andWhere('record.branch_id = :branchId', { branchId });
    }

    if (status) {
      qb.andWhere('record.status = :status', { status });
    }

    if (dateFrom) {
      qb.andWhere('record.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('record.createdAt <= :dateTo', { dateTo });
    }

    qb.orderBy(`record.${sortBy}`, sortOrder);
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

  async findOne(id: string): Promise<MedicalRecord> {
    const record = await this.medicalRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Medical record with ID "${id}" not found`);
    }
    return record;
  }

  private checkOwnership(record: MedicalRecord, currentUserId?: string): void {
    if (!currentUserId) return;
    if (record.doctorId !== currentUserId) {
      throw new ForbiddenException('Вы можете редактировать только свои медицинские записи');
    }
  }

  async update(id: string, dto: UpdateMedicalRecordDto, currentUserId?: string): Promise<MedicalRecord> {
    const record = await this.findOne(id);
    this.checkOwnership(record, currentUserId);
    if (record.status === MedicalRecordStatus.SIGNED) {
      throw new BadRequestException('Cannot update a signed medical record');
    }
    Object.assign(record, dto);
    return this.medicalRecordRepository.save(record);
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    const record = await this.findOne(id);
    this.checkOwnership(record, currentUserId);
    if (record.status === MedicalRecordStatus.SIGNED) {
      throw new BadRequestException('Cannot delete a signed medical record');
    }
    await this.medicalRecordRepository.softRemove(record);
  }

  async sign(
    id: string,
    currentUserId?: string,
    signatureData?: { signatureImage?: string },
  ): Promise<MedicalRecord> {
    const record = await this.findOne(id);
    this.checkOwnership(record, currentUserId);
    if (record.status === MedicalRecordStatus.SIGNED) {
      throw new BadRequestException('Medical record is already signed');
    }

    // Generate SHA-256 hash of key record fields
    const contentToHash = JSON.stringify({
      patientId: record.patientId,
      doctorId: record.doctorId,
      complaints: record.complaints,
      anamnesis: record.anamnesis,
      examination: record.examination,
      diagnosis: record.diagnosis,
      diagnosisCode: record.diagnosisCode,
      recommendations: record.recommendations,
    });
    const signatureHash = createHash('sha256').update(contentToHash).digest('hex');

    record.status = MedicalRecordStatus.SIGNED;
    record.signedAt = new Date();
    record.signatureHash = signatureHash;
    record.signedById = currentUserId || record.doctorId;
    if (signatureData?.signatureImage) {
      record.signatureImage = signatureData.signatureImage;
    }
    return this.medicalRecordRepository.save(record);
  }

  private static readonly AMENDABLE_FIELDS = [
    'complaints', 'anamnesis', 'examination', 'diagnosis',
    'diagnosisCode', 'recommendations', 'notes', 'data',
  ] as const;

  async amend(
    id: string,
    dto: AmendMedicalRecordDto,
    currentUserId?: string,
  ): Promise<MedicalRecord> {
    const record = await this.findOne(id);
    this.checkOwnership(record, currentUserId);

    if (record.status !== MedicalRecordStatus.SIGNED && record.status !== MedicalRecordStatus.AMENDED) {
      throw new BadRequestException(
        'Only signed or previously amended records can be amended',
      );
    }

    // Determine which fields are actually changing
    const changedFields: string[] = [];
    const previousContent: Record<string, any> = {};

    for (const field of MedicalRecordsService.AMENDABLE_FIELDS) {
      if (dto[field] !== undefined && dto[field] !== record[field]) {
        changedFields.push(field);
        previousContent[field] = record[field];
      }
    }

    if (changedFields.length === 0) {
      throw new BadRequestException('No changes detected in the amendment');
    }

    // Build amendment entry
    const amendedBy = currentUserId || record.doctorId;
    const amendmentEntry = {
      amendedBy,
      amendedAt: new Date().toISOString(),
      reason: dto.reason,
      previousContent,
      changedFields,
    };

    // Append to amendments history
    const amendments = record.amendments ? [...record.amendments] : [];
    amendments.push(amendmentEntry);
    record.amendments = amendments;

    // Apply the changes
    for (const field of changedFields) {
      (record as any)[field] = dto[field as keyof AmendMedicalRecordDto];
    }

    record.status = MedicalRecordStatus.AMENDED;
    const savedRecord = await this.medicalRecordRepository.save(record);

    // Write to audit log
    await this.auditService.log({
      userId: amendedBy,
      action: 'MEDICAL_RECORD_AMENDED',
      entityType: 'MedicalRecord',
      entityId: id,
      details: {
        reason: dto.reason,
        changedFields,
        previousContent,
      },
    });

    return savedRecord;
  }
}
