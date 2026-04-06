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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { RoomsService } from '../services/rooms.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';
import { Room } from '../entities/room.entity';

@ApiTags('Scheduling - Rooms')
@Controller('scheduling/rooms')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created', type: Room })
  create(@Body() dto: CreateRoomDto): Promise<Room> {
    return this.roomsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiResponse({ status: 200, description: 'List of rooms', type: [Room] })
  findAll(@Query('branchId') branchId?: string): Promise<Room[]> {
    return this.roomsService.findAll(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a room by id' })
  @ApiResponse({ status: 200, description: 'Room details', type: Room })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Room> {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a room' })
  @ApiResponse({ status: 200, description: 'Room updated', type: Room })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoomDto,
  ): Promise<Room> {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a room' })
  @ApiResponse({ status: 200, description: 'Room deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.roomsService.remove(id);
  }
}
