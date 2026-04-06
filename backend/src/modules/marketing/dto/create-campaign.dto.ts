import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignChannel } from '../entities/campaign.entity';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Весенняя акция' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: CampaignChannel })
  @IsEnum(CampaignChannel)
  channel: CampaignChannel;

  @ApiProperty({ example: 'Уважаемые пациенты! Скидка 20% на все услуги!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  targetAudience?: Record<string, any>;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  scheduledAt?: Date;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  createdById: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  branchId?: string;
}
