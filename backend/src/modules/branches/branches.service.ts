import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { RedisCacheService } from '../cache/cache.service';

const BRANCHES_CACHE_KEY = 'branches:all';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly cacheService: RedisCacheService,
  ) {}

  async create(dto: CreateBranchDto): Promise<Branch> {
    const branch = this.branchRepository.create(dto);
    const saved = await this.branchRepository.save(branch);
    await this.cacheService.del(BRANCHES_CACHE_KEY);
    return saved;
  }

  async findAll(): Promise<Branch[]> {
    return this.cacheService.getOrSet(
      BRANCHES_CACHE_KEY,
      async () =>
        this.branchRepository.find({
          order: { isMain: 'DESC', name: 'ASC' },
        }),
      300,
    );
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch #${id} not found`);
    }
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);
    Object.assign(branch, dto);
    const saved = await this.branchRepository.save(branch);
    await this.cacheService.del(BRANCHES_CACHE_KEY);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);
    await this.branchRepository.softRemove(branch);
    await this.cacheService.del(BRANCHES_CACHE_KEY);
  }
}
