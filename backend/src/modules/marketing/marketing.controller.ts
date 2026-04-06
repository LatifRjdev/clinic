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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MarketingService } from './marketing.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { Promotion } from './entities/promotion.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Marketing')
@Controller('marketing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@ApiBearerAuth()
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  // --- Campaigns ---

  @Post('campaigns')
  @ApiOperation({ summary: 'Create campaign' })
  @ApiResponse({ status: 201, type: Campaign })
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.marketingService.createCampaign(dto);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List campaigns' })
  @ApiQuery({ name: 'status', required: false })
  findAllCampaigns(@Query('status') status?: CampaignStatus) {
    return this.marketingService.findAllCampaigns(status);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  findOneCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingService.findOneCampaign(id);
  }

  @Patch('campaigns/:id')
  @ApiOperation({ summary: 'Update campaign' })
  updateCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<Campaign>,
  ) {
    return this.marketingService.updateCampaign(id, data);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete campaign' })
  deleteCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingService.deleteCampaign(id);
  }

  // --- Promotions ---

  @Post('promotions')
  @ApiOperation({ summary: 'Create promotion' })
  @ApiResponse({ status: 201, type: Promotion })
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.marketingService.createPromotion(dto);
  }

  @Get('promotions')
  @ApiOperation({ summary: 'List promotions' })
  @ApiQuery({ name: 'activeOnly', required: false })
  findAllPromotions(@Query('activeOnly') activeOnly?: string) {
    return this.marketingService.findAllPromotions(activeOnly === 'true');
  }

  @Get('promotions/:id')
  @ApiOperation({ summary: 'Get promotion by ID' })
  findOnePromotion(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingService.findOnePromotion(id);
  }

  @Patch('promotions/:id')
  @ApiOperation({ summary: 'Update promotion' })
  updatePromotion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<Promotion>,
  ) {
    return this.marketingService.updatePromotion(id, data);
  }

  @Delete('promotions/:id')
  @ApiOperation({ summary: 'Delete promotion' })
  deletePromotion(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketingService.deletePromotion(id);
  }

  // --- Promo code validation ---

  @Get('promo-code/validate')
  @ApiOperation({ summary: 'Validate promo code' })
  @ApiQuery({ name: 'code', required: true })
  validatePromoCode(@Query('code') code: string) {
    return this.marketingService.validatePromoCode(code);
  }
}
