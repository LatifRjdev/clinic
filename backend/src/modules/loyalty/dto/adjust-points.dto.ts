import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class AdjustPointsDto {
  @ApiProperty({
    description: 'Points delta (positive to add, negative to subtract)',
    example: 100,
  })
  @IsInt()
  delta: number;

  @ApiProperty({ required: false, description: 'Reason for the adjustment' })
  @IsOptional()
  @IsString()
  reason?: string;
}
