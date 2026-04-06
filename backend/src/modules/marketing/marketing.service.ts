import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { Promotion } from './entities/promotion.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}

  // --- Campaigns ---

  async createCampaign(dto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignRepository.create(dto);
    return this.campaignRepository.save(campaign);
  }

  async findAllCampaigns(status?: CampaignStatus): Promise<Campaign[]> {
    const qb = this.campaignRepository.createQueryBuilder('c');
    if (status) qb.where('c.status = :status', { status });
    return qb.orderBy('c.created_at', 'DESC').getMany();
  }

  async findOneCampaign(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campaign #${id} not found`);
    return campaign;
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const campaign = await this.findOneCampaign(id);
    Object.assign(campaign, data);
    return this.campaignRepository.save(campaign);
  }

  async deleteCampaign(id: string): Promise<void> {
    const campaign = await this.findOneCampaign(id);
    await this.campaignRepository.softRemove(campaign);
  }

  // --- Promotions ---

  async createPromotion(dto: CreatePromotionDto): Promise<Promotion> {
    const promo = this.promotionRepository.create(dto);
    return this.promotionRepository.save(promo);
  }

  async findAllPromotions(activeOnly = false): Promise<Promotion[]> {
    const qb = this.promotionRepository.createQueryBuilder('p');
    if (activeOnly) {
      qb.where('p.is_active = true')
        .andWhere('p.start_date <= :now', { now: new Date() })
        .andWhere('p.end_date >= :now', { now: new Date() });
    }
    return qb.orderBy('p.created_at', 'DESC').getMany();
  }

  async findOnePromotion(id: string): Promise<Promotion> {
    const promo = await this.promotionRepository.findOne({ where: { id } });
    if (!promo) throw new NotFoundException(`Promotion #${id} not found`);
    return promo;
  }

  async updatePromotion(id: string, data: Partial<Promotion>): Promise<Promotion> {
    const promo = await this.findOnePromotion(id);
    Object.assign(promo, data);
    return this.promotionRepository.save(promo);
  }

  async deletePromotion(id: string): Promise<void> {
    const promo = await this.findOnePromotion(id);
    await this.promotionRepository.softRemove(promo);
  }

  async validatePromoCode(code: string): Promise<{ valid: boolean; promotion?: Promotion }> {
    const promo = await this.promotionRepository.findOne({
      where: { promoCode: code, isActive: true },
    });

    if (!promo) return { valid: false };

    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);

    if (now < start || now > end) return { valid: false };
    if (promo.maxUses && promo.currentUses >= promo.maxUses) return { valid: false };

    return { valid: true, promotion: promo };
  }
}
