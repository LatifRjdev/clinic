import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Тип файла ${file.mimetype} не поддерживается`), false);
        }
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('Файл не предоставлен');
    return this.storageService.upload(file, folder || 'general');
  }

  @Get('url/*key')
  async getUrl(@Param('key') key: string) {
    const url = await this.storageService.getPresignedUrl(key);
    return { url };
  }

  @Get('upload-url')
  async getUploadUrl(
    @Query('key') key: string,
    @Query('contentType') contentType: string,
  ) {
    if (!key || !contentType) {
      throw new BadRequestException('key and contentType required');
    }
    const url = await this.storageService.getPresignedUploadUrl(key, contentType);
    return { url, key };
  }

  @Delete('*key')
  async delete(@Param('key') key: string) {
    await this.storageService.delete(key);
    return { deleted: true };
  }

  @Get('list')
  async list(@Query('prefix') prefix: string = '') {
    const files = await this.storageService.listFiles(prefix);
    return { files };
  }
}
