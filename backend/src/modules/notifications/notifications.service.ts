import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationSettings } from './entities/notification-settings.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SearchNotificationsDto } from './dto/search-notifications.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationSettings)
    private readonly settingsRepository: Repository<NotificationSettings>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    const saved = await this.notificationRepository.save(notification);

    // Push real-time notification via WebSocket
    this.notificationsGateway.sendToUser(saved.userId, saved);

    return saved;
  }

  async getForUser(userId: string, searchDto: SearchNotificationsDto) {
    const {
      type,
      isRead,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.notificationRepository.createQueryBuilder('notification');
    qb.where('notification.userId = :userId', { userId });

    if (type) {
      qb.andWhere('notification.type = :type', { type });
    }

    if (isRead !== undefined) {
      qb.andWhere('notification.isRead = :isRead', { isRead });
    }

    qb.orderBy(`notification.${sortBy}`, sortOrder);
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

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }
    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('user_id = :userId AND is_read = false', { userId })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  // --- Settings ---

  async getSettings(userId: string): Promise<NotificationSettings | null> {
    return this.settingsRepository.findOne({ where: { userId } });
  }

  async upsertSettings(
    userId: string,
    data: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    let settings = await this.settingsRepository.findOne({ where: { userId } });
    if (settings) {
      Object.assign(settings, data);
    } else {
      settings = this.settingsRepository.create({ userId, ...data });
    }
    return this.settingsRepository.save(settings);
  }
}
