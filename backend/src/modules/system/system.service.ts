import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SystemSettings } from './entities/system-settings.entity';
import { SystemLog, LogLevel } from './entities/system-log.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(SystemSettings)
    private readonly settingsRepository: Repository<SystemSettings>,
    @InjectRepository(SystemLog)
    private readonly logRepository: Repository<SystemLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // --- User Management ---

  async findAllUsers(params?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: User[]; total: number }> {
    const { role, isActive, search, page = 1, limit = 20 } = params || {};
    const qb = this.userRepository.createQueryBuilder('u');

    if (role) qb.andWhere('u.role = :role', { role });
    if (isActive !== undefined) qb.andWhere('u.is_active = :isActive', { isActive });
    if (search) {
      qb.andWhere(
        '(u.first_name ILIKE :s OR u.last_name ILIKE :s OR u.email ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    qb.select([
      'u.id', 'u.email', 'u.firstName', 'u.lastName', 'u.middleName',
      'u.phone', 'u.role', 'u.isActive', 'u.lastLoginAt', 'u.departmentId',
      'u.branchId', 'u.specialty', 'u.createdAt',
    ]);

    qb.orderBy('u.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async blockUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    user.isActive = false;
    return this.userRepository.save(user);
  }

  async unblockUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    user.isActive = true;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    return this.userRepository.save(user);
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    user.password = await bcrypt.hash(newPassword, 10);
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await this.userRepository.save(user);
  }

  // --- System Settings ---

  async getAllSettings(category?: string): Promise<SystemSettings[]> {
    const where = category ? { category } : {};
    return this.settingsRepository.find({ where, order: { category: 'ASC', key: 'ASC' } });
  }

  async getSetting(key: string): Promise<SystemSettings | null> {
    return this.settingsRepository.findOne({ where: { key } });
  }

  async upsertSetting(
    key: string,
    value: string,
    category?: string,
    description?: string,
    valueType?: string,
  ): Promise<SystemSettings> {
    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
      if (category) setting.category = category;
      if (description) setting.description = description;
      if (valueType) setting.valueType = valueType;
    } else {
      setting = this.settingsRepository.create({
        key,
        value,
        category: category || null,
        description: description || null,
        valueType: valueType || 'string',
      });
    }
    return this.settingsRepository.save(setting);
  }

  async deleteSetting(key: string): Promise<void> {
    await this.settingsRepository.delete({ key });
  }

  // --- System Logs ---

  async createLog(
    level: LogLevel,
    source: string,
    message: string,
    metadata?: Record<string, any>,
    userId?: string,
    ipAddress?: string,
  ): Promise<SystemLog> {
    const log = this.logRepository.create({
      level,
      source,
      message,
      metadata: metadata || null,
      userId: userId || null,
      ipAddress: ipAddress || null,
    });
    return this.logRepository.save(log);
  }

  async getLogs(params?: {
    level?: LogLevel;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: SystemLog[]; total: number }> {
    const { level, source, dateFrom, dateTo, page = 1, limit = 50 } = params || {};

    const qb = this.logRepository.createQueryBuilder('log');
    if (level) qb.andWhere('log.level = :level', { level });
    if (source) qb.andWhere('log.source = :source', { source });
    if (dateFrom) qb.andWhere('log.created_at >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('log.created_at <= :dateTo', { dateTo });

    qb.orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
