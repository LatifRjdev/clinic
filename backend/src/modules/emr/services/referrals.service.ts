import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralStatus } from '../entities/referral.entity';
import { CreateReferralDto } from '../dto/create-referral.dto';
import { UpdateReferralDto } from '../dto/update-referral.dto';
import { SearchReferralDto } from '../dto/search-referral.dto';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
  ) {}

  async create(dto: CreateReferralDto): Promise<Referral> {
    const referral = this.referralRepository.create(dto);
    return this.referralRepository.save(referral);
  }

  async findAll(searchDto: SearchReferralDto) {
    const {
      patientId,
      referringDoctorId,
      targetDoctorId,
      status,
      priority,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.referralRepository.createQueryBuilder('referral');

    if (patientId) {
      qb.andWhere('referral.patientId = :patientId', { patientId });
    }

    if (referringDoctorId) {
      qb.andWhere('referral.referringDoctorId = :referringDoctorId', { referringDoctorId });
    }

    if (targetDoctorId) {
      qb.andWhere('referral.targetDoctorId = :targetDoctorId', { targetDoctorId });
    }

    if (status) {
      qb.andWhere('referral.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('referral.priority = :priority', { priority });
    }

    if (dateFrom) {
      qb.andWhere('referral.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('referral.createdAt <= :dateTo', { dateTo });
    }

    qb.orderBy(`referral.${sortBy}`, sortOrder);
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

  async findOne(id: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({ where: { id } });
    if (!referral) {
      throw new NotFoundException(`Referral with ID "${id}" not found`);
    }
    return referral;
  }

  private checkOwnership(referral: Referral, currentUserId?: string): void {
    if (!currentUserId) return;
    if (referral.referringDoctorId !== currentUserId) {
      throw new ForbiddenException('Вы можете редактировать только свои направления');
    }
  }

  async update(id: string, dto: UpdateReferralDto, currentUserId?: string): Promise<Referral> {
    const referral = await this.findOne(id);
    this.checkOwnership(referral, currentUserId);
    Object.assign(referral, dto);
    return this.referralRepository.save(referral);
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    const referral = await this.findOne(id);
    this.checkOwnership(referral, currentUserId);
    await this.referralRepository.softRemove(referral);
  }

  async changeStatus(id: string, status: ReferralStatus, currentUserId?: string): Promise<Referral> {
    const referral = await this.findOne(id);
    this.checkOwnership(referral, currentUserId);
    referral.status = status;
    return this.referralRepository.save(referral);
  }

  async createInterBranch(dto: CreateReferralDto): Promise<Referral> {
    if (!dto.targetBranchId) {
      throw new BadRequestException('targetBranchId обязателен для межфилиального направления');
    }
    const referral = this.referralRepository.create({
      ...dto,
      isInterBranch: true,
    });
    return this.referralRepository.save(referral);
  }

  async findIncoming(branchId: string, status?: ReferralStatus) {
    if (!branchId) {
      throw new BadRequestException('branchId не определён для текущего пользователя');
    }
    const qb = this.referralRepository
      .createQueryBuilder('referral')
      .where('referral.isInterBranch = :flag', { flag: true })
      .andWhere('referral.targetBranchId = :branchId', { branchId });

    if (status) {
      qb.andWhere('referral.status = :status', { status });
    }

    qb.orderBy('referral.createdAt', 'DESC');
    return qb.getMany();
  }

  async accept(id: string): Promise<Referral> {
    const referral = await this.findOne(id);
    if (!referral.isInterBranch) {
      throw new BadRequestException('Направление не является межфилиальным');
    }
    referral.status = ReferralStatus.ACCEPTED;
    return this.referralRepository.save(referral);
  }
}
