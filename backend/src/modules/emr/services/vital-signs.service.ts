import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VitalSigns } from '../entities/vital-signs.entity';
import { CreateVitalSignsDto } from '../dto/create-vital-signs.dto';
import { UpdateVitalSignsDto } from '../dto/update-vital-signs.dto';

@Injectable()
export class VitalSignsService {
  constructor(
    @InjectRepository(VitalSigns)
    private readonly vitalSignsRepository: Repository<VitalSigns>,
  ) {}

  async create(dto: CreateVitalSignsDto): Promise<VitalSigns> {
    const vitals = this.vitalSignsRepository.create(dto);
    return this.vitalSignsRepository.save(vitals);
  }

  async findByPatient(patientId: string): Promise<VitalSigns[]> {
    return this.vitalSignsRepository.find({
      where: { patientId },
      order: { measuredAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<VitalSigns> {
    const vitals = await this.vitalSignsRepository.findOne({ where: { id } });
    if (!vitals) {
      throw new NotFoundException(`Vital signs record #${id} not found`);
    }
    return vitals;
  }

  async update(id: string, dto: UpdateVitalSignsDto): Promise<VitalSigns> {
    const vitals = await this.findOne(id);
    Object.assign(vitals, dto);
    return this.vitalSignsRepository.save(vitals);
  }

  async remove(id: string): Promise<void> {
    const vitals = await this.findOne(id);
    await this.vitalSignsRepository.softRemove(vitals);
  }

  async getChartData(
    patientId: string,
    days: number = 30,
  ): Promise<VitalSigns[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.vitalSignsRepository
      .createQueryBuilder('v')
      .where('v.patient_id = :patientId', { patientId })
      .andWhere('v.measured_at >= :since', { since })
      .orderBy('v.measured_at', 'ASC')
      .getMany();
  }
}
