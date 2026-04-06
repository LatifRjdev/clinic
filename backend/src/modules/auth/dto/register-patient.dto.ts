import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterPatientDto {
  @ApiProperty({ example: 'patient@mail.tj' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongP@ss1', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Пароль должен содержать минимум 8 символов, 1 заглавную букву, 1 строчную букву и 1 цифру',
  })
  password: string;

  @ApiProperty({ example: 'Иван' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Иванов' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'Петрович' })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({ example: '+992901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
