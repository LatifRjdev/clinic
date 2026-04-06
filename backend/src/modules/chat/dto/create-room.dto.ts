import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatRoomType } from '../entities/chat-room.entity';

export class CreateRoomDto {
  @ApiPropertyOptional({ description: 'Room name (for group chats)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: ChatRoomType })
  @IsEnum(ChatRoomType)
  type: ChatRoomType;

  @ApiProperty({ description: 'User IDs to add to the room', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds: string[];
}
