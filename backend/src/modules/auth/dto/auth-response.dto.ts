import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/roles.enum';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ nullable: true })
  middleName: string | null;

  @ApiProperty()
  phone: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty()
  preferredLanguage: 'ru' | 'tj';

  @ApiPropertyOptional({ nullable: true })
  departmentId: string | null;

  @ApiPropertyOptional({ nullable: true })
  branchId: string | null;

  @ApiPropertyOptional({ nullable: true })
  specialty: string | null;

  @ApiPropertyOptional({ nullable: true })
  qualification: string | null;

  @ApiPropertyOptional({ nullable: true })
  licenseNumber: string | null;

  @ApiPropertyOptional({ nullable: true })
  photoUrl: string | null;

  @ApiProperty()
  twoFactorEnabled: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
