import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSettings } from './entities/system-settings.entity';
import { SystemLog } from './entities/system-log.entity';
import { User } from '../auth/entities/user.entity';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { MonitoringController } from './monitoring.controller';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSettings, SystemLog, User])],
  controllers: [SystemController, MonitoringController, IntegrationsController],
  providers: [SystemService, IntegrationsService],
  exports: [SystemService, IntegrationsService],
})
export class SystemModule {}
