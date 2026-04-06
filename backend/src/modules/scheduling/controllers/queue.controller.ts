import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, UseInterceptors, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { QueueService } from '../services/queue.service';

@ApiTags('Queue')
@Controller('queue')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @ApiOperation({ summary: 'Get current queue' })
  getQueue(
    @Query('date') date?: string,
    @Query('branchId') branchId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.queueService.getQueue(date, branchId, doctorId);
  }

  @Post('call-next')
  @ApiOperation({ summary: 'Call next patient in queue' })
  callNext(
    @Body('doctorId') doctorId: string,
    @Body('branchId') branchId?: string,
  ) {
    return this.queueService.callNext(doctorId, branchId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update queue item status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: 'completed' | 'no_show' | 'cancelled',
  ) {
    return this.queueService.updateQueueStatus(id, status);
  }
}
