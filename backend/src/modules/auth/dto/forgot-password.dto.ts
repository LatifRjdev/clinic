import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'doctor@clinic.tj' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
