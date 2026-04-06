import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { RedisCacheService } from '../../cache/cache.service';

const DEPARTMENTS_CACHE_KEY = 'departments:all';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly cacheService: RedisCacheService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const department = this.departmentRepository.create(createDepartmentDto);
    const saved = await this.departmentRepository.save(department);
    await this.cacheService.del(DEPARTMENTS_CACHE_KEY);
    return saved;
  }

  async findAll(): Promise<Department[]> {
    return this.cacheService.getOrSet(
      DEPARTMENTS_CACHE_KEY,
      async () => this.departmentRepository.find({ where: { isActive: true } }),
      300,
    );
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }
    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.findOne(id);
    Object.assign(department, updateDepartmentDto);
    const saved = await this.departmentRepository.save(department);
    await this.cacheService.del(DEPARTMENTS_CACHE_KEY);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const department = await this.findOne(id);
    await this.departmentRepository.softRemove(department);
    await this.cacheService.del(DEPARTMENTS_CACHE_KEY);
  }
}
