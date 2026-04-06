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
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReferralsService } from '../services/referrals.service';
import { CreateReferralDto } from '../dto/create-referral.dto';
import { UpdateReferralDto } from '../dto/update-referral.dto';
import { SearchReferralDto } from '../dto/search-referral.dto';
import { ReferralStatus } from '../entities/referral.entity';
import { UserRole } from '../../../common/enums/roles.enum';

@ApiTags('EMR - Referrals')
@Controller('emr/referrals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReferralsController {
  private readonly bypassRoles = [UserRole.OWNER, UserRole.SYSADMIN, UserRole.CHIEF_DOCTOR, UserRole.ADMIN];

  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new referral' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateReferralDto) {
    return this.referralsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list referrals with pagination' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchReferralDto) {
    return this.referralsService.findAll(searchDto);
  }

  @Post('inter-branch')
  @ApiOperation({ summary: 'Create an inter-branch referral (refer patient to another branch)' })
  @ApiResponse({ status: 201 })
  createInterBranch(@Body() dto: CreateReferralDto) {
    return this.referralsService.createInterBranch(dto);
  }

  @Get('incoming')
  @ApiOperation({ summary: 'Get inter-branch referrals incoming to current user branch' })
  @ApiResponse({ status: 200 })
  findIncoming(
    @Req() req: { user: { id: string; role: string; branchId?: string } },
    @Query('status') status?: ReferralStatus,
  ) {
    return this.referralsService.findIncoming(req.user.branchId as string, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a referral by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.referralsService.findOne(id);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept an inter-branch referral at the receiving branch' })
  @ApiResponse({ status: 200 })
  accept(@Param('id', ParseUUIDPipe) id: string) {
    return this.referralsService.accept(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a referral' })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReferralDto,
    @Req() req: { user: { id: string; role: string } },
  ) {
    const userId = this.bypassRoles.includes(req.user.role as UserRole) ? undefined : req.user.id;
    return this.referralsService.update(id, dto, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change referral status' })
  @ApiResponse({ status: 200 })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ReferralStatus,
    @Req() req: { user: { id: string; role: string } },
  ) {
    const userId = this.bypassRoles.includes(req.user.role as UserRole) ? undefined : req.user.id;
    return this.referralsService.changeStatus(id, status, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a referral' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string; role: string } },
  ) {
    const userId = this.bypassRoles.includes(req.user.role as UserRole) ? undefined : req.user.id;
    return this.referralsService.remove(id, userId);
  }
}
