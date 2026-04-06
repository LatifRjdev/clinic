import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { SearchAuditDto } from './dto/search-audit.dto';

export interface AuditLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: AuditLogParams): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || null,
      details: params.details || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    });
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(searchDto: SearchAuditDto) {
    const {
      userId,
      action,
      entityType,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.auditLogRepository.createQueryBuilder('audit');

    if (userId) {
      qb.andWhere('audit.user_id = :userId', { userId });
    }

    if (action) {
      qb.andWhere('audit.action = :action', { action });
    }

    if (entityType) {
      qb.andWhere('audit.entity_type = :entityType', { entityType });
    }

    if (dateFrom) {
      qb.andWhere('audit.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('audit.created_at <= :dateTo', { dateTo });
    }

    qb.orderBy(`audit.${sortBy}`, sortOrder);
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
}
