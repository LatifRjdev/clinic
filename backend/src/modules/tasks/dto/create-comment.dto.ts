import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment author user ID' })
  @IsUUID()
  authorId: string;

  @ApiProperty({ description: 'Comment content' })
  @IsString()
  content: string;
}
