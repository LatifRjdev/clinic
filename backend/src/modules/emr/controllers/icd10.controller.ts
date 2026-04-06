import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Icd10Service } from '../services/icd10.service';

@ApiTags('EMR - ICD-10')
@Controller('icd10')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class Icd10Controller {
  constructor(private readonly icd10Service: Icd10Service) {}

  @Get('search')
  @ApiOperation({ summary: 'Search ICD-10 codes' })
  search(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.icd10Service.search(query, limit ? parseInt(limit) : 20);
  }

  @Get('code')
  @ApiOperation({ summary: 'Get ICD-10 code by code' })
  findByCode(@Query('code') code: string) {
    return this.icd10Service.findByCode(code);
  }
}
