import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SearchMessagesDto } from './dto/search-messages.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Create a new chat room' })
  @ApiResponse({ status: 201 })
  createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.chatService.createRoom(createRoomDto);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Get chat rooms for a user' })
  @ApiResponse({ status: 200 })
  getRooms(@Query('userId', ParseUUIDPipe) userId: string) {
    return this.chatService.getRoomsForUser(userId);
  }

  @Post('rooms/:id/members')
  @ApiOperation({ summary: 'Add a member to a chat room' })
  @ApiResponse({ status: 201 })
  addMember(
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.chatService.addMember(roomId, userId);
  }

  @Post('rooms/:id/messages')
  @ApiOperation({ summary: 'Send a message to a chat room' })
  @ApiResponse({ status: 201 })
  sendMessage(
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(roomId, sendMessageDto);
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Get messages from a chat room with pagination' })
  @ApiResponse({ status: 200 })
  getMessages(
    @Param('id', ParseUUIDPipe) roomId: string,
    @Query() searchDto: SearchMessagesDto,
  ) {
    return this.chatService.getMessages(roomId, searchDto);
  }

  @Patch('rooms/:id/read')
  @ApiOperation({ summary: 'Mark all messages in a room as read' })
  @ApiResponse({ status: 200 })
  markAsRead(
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.chatService.markAllAsRead(roomId, userId);
  }
}
