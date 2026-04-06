import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatMessageType } from '../entities/chat-message.entity';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: ChatMessageType, default: ChatMessageType.TEXT })
  @IsOptional()
  @IsEnum(ChatMessageType)
  type?: ChatMessageType = ChatMessageType.TEXT;

  @ApiPropertyOptional({ description: 'File URL if message type is file' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ description: 'Sender user ID' })
  @IsUUID()
  senderId: string;
}
