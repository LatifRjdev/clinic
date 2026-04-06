import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoSession, VideoSessionStatus } from './entities/video-session.entity';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class TelemedicineService {
  constructor(
    @InjectRepository(VideoSession)
    private readonly sessionRepository: Repository<VideoSession>,
  ) {}

  async create(dto: CreateSessionDto): Promise<VideoSession> {
    const session = this.sessionRepository.create({
      ...dto,
      status: VideoSessionStatus.WAITING,
      roomUrl: dto.roomUrl || `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
    return this.sessionRepository.save(session);
  }

  async findAll(params?: {
    doctorId?: string;
    patientId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { doctorId, patientId, status, page = 1, limit = 20 } = params || {};

    const qb = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.doctor', 'doctor')
      .leftJoinAndSelect('session.patient', 'patient')
      .leftJoinAndSelect('session.appointment', 'appointment');

    if (doctorId) {
      qb.andWhere('session.doctorId = :doctorId', { doctorId });
    }
    if (patientId) {
      qb.andWhere('session.patientId = :patientId', { patientId });
    }
    if (status) {
      qb.andWhere('session.status = :status', { status });
    }

    qb.orderBy('session.createdAt', 'DESC');
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

  async findOne(id: string): Promise<VideoSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['doctor', 'patient', 'appointment'],
    });
    if (!session) {
      throw new NotFoundException(`Video session with ID "${id}" not found`);
    }
    return session;
  }

  async start(id: string): Promise<VideoSession> {
    const session = await this.findOne(id);
    if (session.status === VideoSessionStatus.ACTIVE) {
      throw new BadRequestException('Session is already active');
    }
    if (session.status === VideoSessionStatus.ENDED) {
      throw new BadRequestException('Session has already ended');
    }
    session.status = VideoSessionStatus.ACTIVE;
    session.startedAt = new Date();
    return this.sessionRepository.save(session);
  }

  async end(id: string): Promise<VideoSession> {
    const session = await this.findOne(id);
    if (session.status === VideoSessionStatus.ENDED) {
      throw new BadRequestException('Session has already ended');
    }
    session.status = VideoSessionStatus.ENDED;
    session.endedAt = new Date();
    if (session.startedAt) {
      session.duration = Math.round(
        (session.endedAt.getTime() - session.startedAt.getTime()) / 1000,
      );
    }
    return this.sessionRepository.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    await this.sessionRepository.softRemove(session);
  }
}
