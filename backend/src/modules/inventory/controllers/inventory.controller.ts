import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from '../services/inventory.service';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- Items ---

  @Post('items')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.NURSE)
  @ApiOperation({ summary: 'Create inventory item' })
  @ApiResponse({ status: 201, type: InventoryItem })
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(dto);
  }

  @Get('items')
  @ApiOperation({ summary: 'List inventory items' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: [InventoryItem] })
  findAllItems(
    @Query('category') category?: string,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.findAllItems({ category, branchId, search });
  }

  @Get('categories')
  @ApiOperation({ summary: 'List distinct inventory categories' })
  @ApiResponse({ status: 200, type: [String] })
  getCategories() {
    return this.inventoryService.getCategories();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items with low stock' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, type: [InventoryItem] })
  getLowStock(@Query('branchId') branchId?: string) {
    return this.inventoryService.getLowStock(branchId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get items expiring soon' })
  @ApiQuery({ name: 'days', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, type: [InventoryItem] })
  getExpiring(
    @Query('days') days?: number,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.getExpiring(days || 30, branchId);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiResponse({ status: 200, type: InventoryItem })
  findOneItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOneItem(id);
  }

  @Patch('items/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.NURSE)
  @ApiOperation({ summary: 'Update inventory item' })
  @ApiResponse({ status: 200, type: InventoryItem })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.NURSE)
  @ApiOperation({ summary: 'Delete inventory item' })
  removeItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.removeItem(id);
  }

  // --- Movements ---

  @Post('movements')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.NURSE)
  @ApiOperation({ summary: 'Record inventory movement' })
  @ApiResponse({ status: 201, type: InventoryMovement })
  createMovement(@Body() dto: CreateMovementDto) {
    return this.inventoryService.createMovement(dto);
  }

  @Get('movements/:itemId')
  @ApiOperation({ summary: 'Get movements for an item' })
  @ApiResponse({ status: 200, type: [InventoryMovement] })
  getMovements(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.inventoryService.getMovements(itemId);
  }
}
