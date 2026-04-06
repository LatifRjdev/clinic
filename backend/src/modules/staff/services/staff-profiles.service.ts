import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffProfile } from '../entities/staff-profile.entity';
import { CreateStaffProfileDto } from '../dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from '../dto/update-staff-profile.dto';
import { SearchStaffDto } from '../dto/search-staff.dto';

@Injectable()
export class StaffProfilesService {
  constructor(
    @InjectRepository(StaffProfile)
    private readonly staffProfileRepository: Repository<StaffProfile>,
  ) {}

  async create(createStaffProfileDto: CreateStaffProfileDto): Promise<StaffProfile> {
    const profile = this.staffProfileRepository.create(createStaffProfileDto);
    return this.staffProfileRepository.save(profile);
  }

  async findAll(searchDto: SearchStaffDto) {
    const {
      branchId,
      departmentId,
      specialty,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.staffProfileRepository.createQueryBuilder('profile');

    if (branchId) {
      qb.andWhere('profile.branch_id = :branchId', { branchId });
    }

    if (departmentId) {
      qb.andWhere('profile.departmentId = :departmentId', { departmentId });
    }

    if (specialty) {
      qb.andWhere('profile.specialty ILIKE :specialty', { specialty: `%${specialty}%` });
    }

    qb.orderBy(`profile.${sortBy}`, sortOrder);
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

  async findOne(id: string): Promise<StaffProfile> {
    const profile = await this.staffProfileRepository.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Staff profile with ID "${id}" not found`);
    }
    return profile;
  }

  async getByUserId(userId: string): Promise<StaffProfile> {
    const profile = await this.staffProfileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException(`Staff profile for user "${userId}" not found`);
    }
    return profile;
  }

  async getByDepartment(departmentId: string): Promise<StaffProfile[]> {
    return this.staffProfileRepository.find({ where: { departmentId } });
  }

  async update(id: string, updateStaffProfileDto: UpdateStaffProfileDto): Promise<StaffProfile> {
    const profile = await this.findOne(id);
    Object.assign(profile, updateStaffProfileDto);
    return this.staffProfileRepository.save(profile);
  }

  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id);
    await this.staffProfileRepository.softRemove(profile);
  }
}
