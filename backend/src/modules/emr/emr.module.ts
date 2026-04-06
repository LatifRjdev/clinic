import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { Referral } from './entities/referral.entity';
import { Prescription } from './entities/prescription.entity';
import { Template } from './entities/template.entity';
import { VitalSigns } from './entities/vital-signs.entity';
import { MedicalRecordsService } from './services/medical-records.service';
import { ReferralsService } from './services/referrals.service';
import { PrescriptionsService } from './services/prescriptions.service';
import { TemplatesService } from './services/templates.service';
import { VitalSignsService } from './services/vital-signs.service';
import { MedicalRecordsController } from './controllers/medical-records.controller';
import { ReferralsController } from './controllers/referrals.controller';
import { PrescriptionsController } from './controllers/prescriptions.controller';
import { TemplatesController } from './controllers/templates.controller';
import { VitalSignsController } from './controllers/vital-signs.controller';
import { Icd10Service } from './services/icd10.service';
import { Icd10Controller } from './controllers/icd10.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecord,
      Referral,
      Prescription,
      Template,
      VitalSigns,
    ]),
  ],
  controllers: [
    MedicalRecordsController,
    ReferralsController,
    PrescriptionsController,
    TemplatesController,
    VitalSignsController,
    Icd10Controller,
  ],
  providers: [
    MedicalRecordsService,
    ReferralsService,
    PrescriptionsService,
    TemplatesService,
    VitalSignsService,
    Icd10Service,
  ],
  exports: [
    MedicalRecordsService,
    ReferralsService,
    PrescriptionsService,
    TemplatesService,
    VitalSignsService,
  ],
})
export class EmrModule {}
