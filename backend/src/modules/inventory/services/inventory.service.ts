import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, LessThan } from 'typeorm';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryMovement, MovementType } from '../entities/inventory-movement.entity';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { RedisCacheService } from '../../cache/cache.service';

const INVENTORY_CATEGORIES_CACHE_KEY = 'inventory:categories';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    private readonly cacheService: RedisCacheService,
  ) {}

  // --- Items ---

  async createItem(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const item = this.itemRepository.create(dto);
    const saved = await this.itemRepository.save(item);
    await this.cacheService.del(INVENTORY_CATEGORIES_CACHE_KEY);
    return saved;
  }

  async getCategories(): Promise<string[]> {
    return this.cacheService.getOrSet(
      INVENTORY_CATEGORIES_CACHE_KEY,
      async () => {
        const result = await this.itemRepository
          .createQueryBuilder('item')
          .select('DISTINCT item.category', 'category')
          .where('item.category IS NOT NULL')
          .orderBy('item.category', 'ASC')
          .getRawMany();
        return result.map((r) => r.category).filter(Boolean);
      },
      300,
    );
  }

  async findAllItems(params?: {
    category?: string;
    branchId?: string;
    search?: string;
  }): Promise<InventoryItem[]> {
    const qb = this.itemRepository.createQueryBuilder('item');
    if (params?.category) qb.andWhere('item.category = :category', { category: params.category });
    if (params?.branchId) qb.andWhere('item.branch_id = :branchId', { branchId: params.branchId });
    if (params?.search) {
      qb.andWhere('(item.name ILIKE :s OR item.sku ILIKE :s)', { s: `%${params.search}%` });
    }
    return qb.orderBy('item.name', 'ASC').getMany();
  }

  async findOneItem(id: string): Promise<InventoryItem> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Item #${id} not found`);
    return item;
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.findOneItem(id);
    Object.assign(item, dto);
    const saved = await this.itemRepository.save(item);
    await this.cacheService.del(INVENTORY_CATEGORIES_CACHE_KEY);
    return saved;
  }

  async removeItem(id: string): Promise<void> {
    const item = await this.findOneItem(id);
    await this.itemRepository.softRemove(item);
    await this.cacheService.del(INVENTORY_CATEGORIES_CACHE_KEY);
  }

  // --- Movements ---

  async createMovement(dto: CreateMovementDto): Promise<InventoryMovement> {
    const item = await this.findOneItem(dto.itemId);

    if (dto.type === MovementType.RECEIPT) {
      item.quantity += dto.quantity;
    } else if (
      dto.type === MovementType.CONSUMPTION ||
      dto.type === MovementType.WRITE_OFF
    ) {
      if (item.quantity < dto.quantity) {
        throw new BadRequestException(
          `Not enough stock. Available: ${item.quantity}`,
        );
      }
      item.quantity -= dto.quantity;
    } else if (dto.type === MovementType.TRANSFER) {
      if (item.quantity < dto.quantity) {
        throw new BadRequestException(
          `Not enough stock. Available: ${item.quantity}`,
        );
      }
      item.quantity -= dto.quantity;
      // TODO: Increase quantity in target branch item
    }

    await this.itemRepository.save(item);

    const movement = this.movementRepository.create(dto);
    return this.movementRepository.save(movement);
  }

  async getMovements(itemId: string): Promise<InventoryMovement[]> {
    return this.movementRepository.find({
      where: { itemId },
      order: { createdAt: 'DESC' },
    });
  }

  // --- Alerts ---

  async getLowStock(branchId?: string): Promise<InventoryItem[]> {
    const qb = this.itemRepository
      .createQueryBuilder('item')
      .where('item.quantity <= item.min_quantity')
      .andWhere('item.is_active = true');

    if (branchId) qb.andWhere('item.branch_id = :branchId', { branchId });

    return qb.orderBy('item.quantity', 'ASC').getMany();
  }

  async getExpiring(days: number = 30, branchId?: string): Promise<InventoryItem[]> {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    const qb = this.itemRepository
      .createQueryBuilder('item')
      .where('item.expiration_date IS NOT NULL')
      .andWhere('item.expiration_date <= :deadline', { deadline })
      .andWhere('item.quantity > 0')
      .andWhere('item.is_active = true');

    if (branchId) qb.andWhere('item.branch_id = :branchId', { branchId });

    return qb.orderBy('item.expiration_date', 'ASC').getMany();
  }
}
