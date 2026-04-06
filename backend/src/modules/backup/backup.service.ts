import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

const MAX_SCHEDULED_BACKUPS = 7;

export interface BackupInfo {
  filename: string;
  size: number;
  createdAt: string;
  type: 'manual' | 'scheduled';
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(private readonly configService: ConfigService) {
    this.backupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(type: 'manual' | 'scheduled' = 'manual'): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `clinic_backup_${type}_${timestamp}.sql`;
    const filePath = path.join(this.backupDir, filename);

    const host = this.configService.get('DB_HOST', 'localhost');
    const port = this.configService.get('DB_PORT', '5432');
    const user = this.configService.get('DB_USERNAME', 'clinic_user');
    const dbName = this.configService.get('DB_NAME', 'clinic_db');
    const password = this.configService.get('DB_PASSWORD', 'clinic_password');

    const cmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName} -F c -f "${filePath}"`;

    try {
      await execAsync(cmd);
      const stats = fs.statSync(filePath);
      const info: BackupInfo = {
        filename,
        size: stats.size,
        createdAt: new Date().toISOString(),
        type,
      };
      this.logger.log(`Backup created: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      return info;
    } catch (err) {
      this.logger.error(`Backup failed: ${err}`);
      throw err;
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    if (!fs.existsSync(this.backupDir)) return [];

    const files = fs.readdirSync(this.backupDir)
      .filter((f) => f.startsWith('clinic_backup_'))
      .sort()
      .reverse();

    return files.map((filename) => {
      const filePath = path.join(this.backupDir, filename);
      const stats = fs.statSync(filePath);
      const isScheduled = filename.includes('_scheduled_');
      return {
        filename,
        size: stats.size,
        createdAt: stats.mtime.toISOString(),
        type: isScheduled ? 'scheduled' as const : 'manual' as const,
      };
    });
  }

  async restoreBackup(filename: string): Promise<{ message: string }> {
    const filePath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found: ${filename}`);
    }

    const host = this.configService.get('DB_HOST', 'localhost');
    const port = this.configService.get('DB_PORT', '5432');
    const user = this.configService.get('DB_USERNAME', 'clinic_user');
    const dbName = this.configService.get('DB_NAME', 'clinic_db');
    const password = this.configService.get('DB_PASSWORD', 'clinic_password');

    const cmd = `PGPASSWORD="${password}" pg_restore -h ${host} -p ${port} -U ${user} -d ${dbName} --clean --if-exists -F c "${filePath}"`;

    try {
      await execAsync(cmd);
      this.logger.log(`Backup restored: ${filename}`);
      return { message: `Бэкап ${filename} успешно восстановлен` };
    } catch (err) {
      this.logger.error(`Restore failed: ${err}`);
      throw err;
    }
  }

  async deleteBackup(filename: string): Promise<void> {
    const filePath = path.join(this.backupDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Scheduled daily backup at 02:00. Keeps only the last MAX_SCHEDULED_BACKUPS
   * scheduled backups (manual backups are preserved).
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleScheduledBackup(): Promise<void> {
    this.logger.log('Running scheduled daily backup...');
    try {
      await this.createBackup('scheduled');
      await this.pruneOldScheduledBackups();
    } catch (err) {
      this.logger.error(`Scheduled backup failed: ${err}`);
    }
  }

  private async pruneOldScheduledBackups(): Promise<void> {
    const all = await this.listBackups();
    const scheduled = all
      .filter((b) => b.type === 'scheduled')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (scheduled.length <= MAX_SCHEDULED_BACKUPS) return;

    const toDelete = scheduled.slice(MAX_SCHEDULED_BACKUPS);
    for (const backup of toDelete) {
      try {
        await this.deleteBackup(backup.filename);
        this.logger.log(`Pruned old scheduled backup: ${backup.filename}`);
      } catch (err) {
        this.logger.error(`Failed to prune ${backup.filename}: ${err}`);
      }
    }
  }
}
