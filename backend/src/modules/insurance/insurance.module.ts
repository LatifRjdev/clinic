import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsuranceCompany } from './entities/insurance-company.entity';
import { InsuranceRegistry } from './entities/insurance-registry.entity';
import { InsuranceService } from './services/insurance.service';
import { InsuranceController } from './controllers/insurance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InsuranceCompany, InsuranceRegistry])],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
