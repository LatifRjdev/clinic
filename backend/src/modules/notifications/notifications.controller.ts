import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SearchNotificationsDto } from './dto/search-notifications.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201 })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiResponse({ status: 200 })
  getForUser(@Req() req: any, @Query() searchDto: SearchNotificationsDto) {
    const userId = searchDto.userId || req.user.id;
    return this.notificationsService.getForUser(userId, searchDto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200 })
  getUnreadCount(@Req() req: any, @Query('userId') userId?: string) {
    return this.notificationsService.getUnreadCount(userId || req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200 })
  markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({ status: 200 })
  markAllAsRead(@Req() req: any, @Query('userId') userId?: string) {
    return this.notificationsService.markAllAsRead(userId || req.user.id);
  }

  // --- Settings ---

  @Get('settings/:userId')
  @ApiOperation({ summary: 'Get notification settings for a user' })
  @ApiResponse({ status: 200 })
  getSettings(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationsService.getSettings(userId);
  }

  @Patch('settings/:userId')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200 })
  updateSettings(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() data: Record<string, any>,
  ) {
    return this.notificationsService.upsertSettings(userId, data);
  }
}
