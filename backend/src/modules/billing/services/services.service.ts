import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { SearchServiceDto } from '../dto/search-service.dto';
import { RedisCacheService } from '../../cache/cache.service';

export interface PaginatedServicesResponse {
  data: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly cacheService: RedisCacheService,
  ) {}

  private async invalidateCache(): Promise<void> {
    await Promise.all([
      this.cacheService.del('services:categories'),
      this.cacheService.del('public:services:all'),
    ]);
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepository.create(dto);
    const saved = await this.serviceRepository.save(service);
    await this.invalidateCache();
    return saved;
  }

  async findAll(searchDto: SearchServiceDto): Promise<PaginatedServicesResponse> {
    const {
      query,
      category,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.serviceRepository.createQueryBuilder('service');

    if (query) {
      const searchTerm = `%${query}%`;
      qb.where(
        new Brackets((bracket) => {
          bracket
            .where('service.name ILIKE :searchTerm', { searchTerm })
            .orWhere('service.code ILIKE :searchTerm', { searchTerm });
        }),
      );
    }

    if (category) {
      qb.andWhere('service.category = :category', { category });
    }

    if (isActive !== undefined) {
      qb.andWhere('service.isActive = :isActive', { isActive });
    }

    qb.orderBy(`service.${sortBy}`, sortOrder);
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

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, dto);
    const saved = await this.serviceRepository.save(service);
    await this.invalidateCache();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.serviceRepository.softRemove(service);
    await this.invalidateCache();
  }

  async getCategories(): Promise<string[]> {
    return this.cacheService.getOrSet(
      'services:categories',
      async () => {
        const result = await this.serviceRepository
          .createQueryBuilder('service')
          .select('DISTINCT service.category', 'category')
          .orderBy('service.category', 'ASC')
          .getRawMany();

        return result.map((r) => r.category);
      },
      300,
    );
  }
}
