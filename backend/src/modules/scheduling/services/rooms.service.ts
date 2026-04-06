import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async create(dto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(dto);
    return this.roomRepository.save(room);
  }

  async findAll(branchId?: string): Promise<Room[]> {
    const qb = this.roomRepository.createQueryBuilder('room');
    if (branchId) {
      qb.andWhere('room.branch_id = :branchId', { branchId });
    }
    return qb.orderBy('room.floor', 'ASC').addOrderBy('room.number', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }
    return room;
  }

  async update(id: string, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, dto);
    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    await this.roomRepository.softRemove(room);
  }
}
