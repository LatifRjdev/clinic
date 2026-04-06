import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactMessagesService } from './contact-messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Contact Messages')
@Controller()
export class ContactMessagesController {
  constructor(
    private readonly contactMessagesService: ContactMessagesService,
  ) {}

  @Post('public/contact')
  @ApiOperation({ summary: 'Submit a contact message (public, no auth)' })
  create(@Body() body: { name: string; email: string; message: string }) {
    return this.contactMessagesService.create(body);
  }

  @Get('contact-messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List contact messages (admin)' })
  findAll(@Query('isRead') isRead?: string) {
    const parsed = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.contactMessagesService.findAll(parsed);
  }

  @Patch('contact-messages/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark contact message as read' })
  markAsRead(@Param('id') id: string) {
    return this.contactMessagesService.markAsRead(id);
  }
}
