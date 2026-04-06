import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Branches')
@Controller('branches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.SYSADMIN)
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, type: Branch })
  async create(@Body() dto: CreateBranchDto): Promise<Branch> {
    return this.branchesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  @ApiResponse({ status: 200, type: [Branch] })
  async findAll(): Promise<Branch[]> {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, type: Branch })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Branch> {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.SYSADMIN)
  @ApiOperation({ summary: 'Update branch' })
  @ApiResponse({ status: 200, type: Branch })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
  ): Promise<Branch> {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.SYSADMIN)
  @ApiOperation({ summary: 'Delete branch (soft delete)' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.branchesService.remove(id);
  }
}
