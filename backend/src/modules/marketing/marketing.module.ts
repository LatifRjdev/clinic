import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { Promotion } from './entities/promotion.entity';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, Promotion])],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
