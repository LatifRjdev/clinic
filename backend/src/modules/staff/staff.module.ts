import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { StaffProfile } from './entities/staff-profile.entity';
import { DepartmentsService } from './services/departments.service';
import { StaffProfilesService } from './services/staff-profiles.service';
import { DepartmentsController } from './controllers/departments.controller';
import { StaffProfilesController } from './controllers/staff-profiles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Department, StaffProfile])],
  controllers: [DepartmentsController, StaffProfilesController],
  providers: [DepartmentsService, StaffProfilesService],
  exports: [DepartmentsService, StaffProfilesService],
})
export class StaffModule {}
