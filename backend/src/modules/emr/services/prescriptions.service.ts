import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from '../entities/prescription.entity';
import { CreatePrescriptionDto } from '../dto/create-prescription.dto';
import { UpdatePrescriptionDto } from '../dto/update-prescription.dto';
import { SearchPrescriptionDto } from '../dto/search-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
  ) {}

  async create(dto: CreatePrescriptionDto): Promise<Prescription> {
    const prescription = this.prescriptionRepository.create(dto);
    return this.prescriptionRepository.save(prescription);
  }

  async findAll(searchDto: SearchPrescriptionDto) {
    const {
      patientId,
      doctorId,
      medicalRecordId,
      isActive,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.prescriptionRepository.createQueryBuilder('prescription');

    if (patientId) {
      qb.andWhere('prescription.patientId = :patientId', { patientId });
    }

    if (doctorId) {
      qb.andWhere('prescription.doctorId = :doctorId', { doctorId });
    }

    if (medicalRecordId) {
      qb.andWhere('prescription.medicalRecordId = :medicalRecordId', { medicalRecordId });
    }

    if (isActive !== undefined) {
      qb.andWhere('prescription.isActive = :isActive', { isActive });
    }

    if (dateFrom) {
      qb.andWhere('prescription.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('prescription.createdAt <= :dateTo', { dateTo });
    }

    qb.orderBy(`prescription.${sortBy}`, sortOrder);
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

  async findOne(id: string): Promise<Prescription> {
    const prescription = await this.prescriptionRepository.findOne({ where: { id } });
    if (!prescription) {
      throw new NotFoundException(`Prescription with ID "${id}" not found`);
    }
    return prescription;
  }

  private checkOwnership(prescription: Prescription, currentUserId?: string): void {
    if (!currentUserId) return;
    if (prescription.doctorId !== currentUserId) {
      throw new ForbiddenException('Вы можете редактировать только свои назначения');
    }
  }

  async update(id: string, dto: UpdatePrescriptionDto, currentUserId?: string): Promise<Prescription> {
    const prescription = await this.findOne(id);
    this.checkOwnership(prescription, currentUserId);
    Object.assign(prescription, dto);
    return this.prescriptionRepository.save(prescription);
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    const prescription = await this.findOne(id);
    this.checkOwnership(prescription, currentUserId);
    await this.prescriptionRepository.softRemove(prescription);
  }
}
