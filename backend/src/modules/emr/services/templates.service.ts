import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../entities/template.entity';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { SearchTemplateDto } from '../dto/search-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
  ) {}

  async create(dto: CreateTemplateDto): Promise<Template> {
    const template = this.templateRepository.create(dto);
    return this.templateRepository.save(template);
  }

  async findAll(searchDto: SearchTemplateDto) {
    const {
      query,
      specialty,
      createdBy,
      isDefault,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.templateRepository.createQueryBuilder('template');

    if (query) {
      qb.andWhere('template.name ILIKE :query', { query: `%${query}%` });
    }

    if (specialty) {
      qb.andWhere('template.specialty = :specialty', { specialty });
    }

    if (createdBy) {
      qb.andWhere('template.createdBy = :createdBy', { createdBy });
    }

    if (isDefault !== undefined) {
      qb.andWhere('template.isDefault = :isDefault', { isDefault });
    }

    qb.orderBy(`template.${sortBy}`, sortOrder);
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

  async findOne(id: string): Promise<Template> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<Template> {
    const template = await this.findOne(id);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.softRemove(template);
  }
}
