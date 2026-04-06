import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../../../common/enums/roles.enum';

export class RegisterDto {
  @ApiProperty({ example: 'doctor@clinic.tj' })
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

  @ApiProperty({ example: 'Акбар' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Каримов' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'Рустамович' })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({ example: '+992901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DOCTOR })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
