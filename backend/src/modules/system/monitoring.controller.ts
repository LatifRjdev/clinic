import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { RedisCacheService } from '../cache/cache.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

@ApiTags('System - Monitoring')
@Controller('system/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.SYSADMIN)
@ApiBearerAuth()
export class MonitoringController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cacheService: RedisCacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get system monitoring data' })
  getMonitoring() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate CPU usage
    const cpuUsage = cpus.map((cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return ((total - idle) / total) * 100;
    });
    const avgCpu = cpuUsage.reduce((a, b) => a + b, 0) / cpuUsage.length;

    return {
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        usage: Math.round(avgCpu * 100) / 100,
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: Math.round((usedMem / totalMem) * 10000) / 100,
        totalGB: (totalMem / 1024 / 1024 / 1024).toFixed(2),
        usedGB: (usedMem / 1024 / 1024 / 1024).toFixed(2),
        freeGB: (freeMem / 1024 / 1024 / 1024).toFixed(2),
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        uptimeFormatted: this.formatUptime(os.uptime()),
        nodeVersion: process.version,
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        uptimeFormatted: this.formatUptime(process.uptime()),
        memoryUsage: process.memoryUsage(),
        heapUsedMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        rssMB: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
      },
      loadAverage: os.loadavg(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('disk')
  @ApiOperation({ summary: 'Get disk usage info' })
  async getDiskUsage() {
    try {
      const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $2, $3, $4, $5}'");
      const [total, used, available, usePercent] = stdout.trim().split(/\s+/);
      return { total, used, available, usePercent };
    } catch {
      return { total: 'N/A', used: 'N/A', available: 'N/A', usePercent: 'N/A' };
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Aggregated health metrics (CPU, memory, disk, DB, Redis, uptime)' })
  async getMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length || 1;

    const [disk, database, redis] = await Promise.all([
      this.getDiskInfo(),
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      cpu: {
        cores: cpuCount,
        loadAverage: {
          '1m': loadAvg[0],
          '5m': loadAvg[1],
          '15m': loadAvg[2],
        },
        // Rough CPU utilisation from 1-minute load average
        usagePercent: Math.min(100, Math.round((loadAvg[0] / cpuCount) * 10000) / 100),
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: Math.round((usedMem / totalMem) * 10000) / 100,
      },
      disk,
      database,
      redis,
      uptime: {
        process: process.uptime(),
        system: os.uptime(),
        processFormatted: this.formatUptime(process.uptime()),
      },
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
  }

  private async getDiskInfo(): Promise<{
    total: string;
    used: string;
    available: string;
    usePercent: string;
  }> {
    try {
      const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $2, $3, $4, $5}'");
      const [total, used, available, usePercent] = stdout.trim().split(/\s+/);
      return { total, used, available, usePercent };
    } catch {
      return { total: 'N/A', used: 'N/A', available: 'N/A', usePercent: 'N/A' };
    }
  }

  private async checkDatabase(): Promise<{ status: 'up' | 'down'; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (err) {
      return { status: 'down', error: err instanceof Error ? err.message : String(err) };
    }
  }

  private async checkRedis(): Promise<{ status: 'up' | 'down'; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      const key = '__monitoring_ping__';
      await this.cacheService.set(key, '1', 5);
      await this.cacheService.get(key);
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (err) {
      return { status: 'down', error: err instanceof Error ? err.message : String(err) };
    }
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}д`);
    if (hours > 0) parts.push(`${hours}ч`);
    parts.push(`${minutes}м`);
    return parts.join(' ');
  }
}
