import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';
import { ServicesService } from '../services/services.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { SearchServiceDto } from '../dto/search-service.dto';

@ApiTags('Billing - Services')
@Controller('billing/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create a new medical service (price list item)' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list medical services with pagination' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchServiceDto) {
    return this.servicesService.findAll(searchDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all service categories' })
  @ApiResponse({ status: 200, type: [String] })
  getCategories() {
    return this.servicesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a medical service by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update a medical service' })
  @ApiResponse({ status: 200 })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTION, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a medical service' })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(id);
  }
}
