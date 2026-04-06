import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomRole } from './entities/custom-role.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([CustomRole])],
  controllers: [RolesController],
  providers: [RolesService, PermissionsGuard],
  exports: [RolesService, PermissionsGuard],
})
export class RolesModule {}
