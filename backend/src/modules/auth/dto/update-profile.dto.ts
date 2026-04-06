import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Акбар' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Каримов' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Рустамович' })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiPropertyOptional({ example: '+992901234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: ['ru', 'tj'], example: 'ru' })
  @IsIn(['ru', 'tj'])
  @IsOptional()
  preferredLanguage?: 'ru' | 'tj';

  @ApiPropertyOptional({ example: 'Кардиолог' })
  @IsString()
  @IsOptional()
  specialty?: string;

  @ApiPropertyOptional({ example: 'Высшая категория' })
  @IsString()
  @IsOptional()
  qualification?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  branchId?: string;
}
