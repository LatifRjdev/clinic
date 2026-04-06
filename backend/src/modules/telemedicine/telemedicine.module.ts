import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoSession } from './entities/video-session.entity';
import { TelemedicineService } from './telemedicine.service';
import { TelemedicineController } from './telemedicine.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VideoSession])],
  controllers: [TelemedicineController],
  providers: [TelemedicineService],
  exports: [TelemedicineService],
})
export class TelemedicineModule {}
