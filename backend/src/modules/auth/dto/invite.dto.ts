import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../../../common/enums/roles.enum';

export class InviteDto {
  @ApiProperty({ example: 'newdoctor@clinic.tj' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Фарход' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Рахимов' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'Каримович' })
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

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class AcceptInviteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'MyStr0ngP@ss', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Пароль должен содержать минимум 8 символов, 1 заглавную букву, 1 строчную букву и 1 цифру',
  })
  password: string;
}
