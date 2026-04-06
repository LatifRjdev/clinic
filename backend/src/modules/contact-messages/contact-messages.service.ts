import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';

@Injectable()
export class ContactMessagesService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactMessageRepository: Repository<ContactMessage>,
  ) {}

  async findAll(isRead?: boolean): Promise<ContactMessage[]> {
    const where: Record<string, unknown> = {};
    if (isRead !== undefined) {
      where.isRead = isRead;
    }
    return this.contactMessageRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: {
    name: string;
    email: string;
    message: string;
  }): Promise<ContactMessage> {
    const entity = this.contactMessageRepository.create(dto);
    return this.contactMessageRepository.save(entity);
  }

  async markAsRead(id: string): Promise<ContactMessage> {
    const msg = await this.contactMessageRepository.findOne({ where: { id } });
    if (!msg) {
      throw new NotFoundException('Contact message not found');
    }
    msg.isRead = true;
    return this.contactMessageRepository.save(msg);
  }
}
