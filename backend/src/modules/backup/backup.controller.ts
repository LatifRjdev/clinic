import { Controller, Get, Post, Delete, Param, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { BackupService } from './backup.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Backup')
@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.SYSADMIN)
@ApiBearerAuth()
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @ApiOperation({ summary: 'List all backups' })
  list() {
    return this.backupService.listBackups();
  }

  @Post('create')
  @ApiOperation({ summary: 'Create manual backup' })
  create() {
    return this.backupService.createBackup('manual');
  }

  @Post('restore/:filename')
  @ApiOperation({ summary: 'Restore from backup' })
  restore(@Param('filename') filename: string) {
    return this.backupService.restoreBackup(filename);
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download backup file' })
  download(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.resolve(process.cwd(), 'backups', filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Файл не найден' });
      return;
    }
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Delete a backup' })
  remove(@Param('filename') filename: string) {
    return this.backupService.deleteBackup(filename);
  }
}
