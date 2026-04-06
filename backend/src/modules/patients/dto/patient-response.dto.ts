import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../entities/patient.entity';

export class PatientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  middleName: string | null;

  @ApiProperty()
  dateOfBirth: Date;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiPropertyOptional()
  email: string | null;

  @ApiPropertyOptional()
  address: string | null;

  @ApiPropertyOptional()
  passportNumber: string | null;

  @ApiPropertyOptional()
  photoUrl: string | null;

  @ApiPropertyOptional()
  bloodType: string | null;

  @ApiPropertyOptional()
  allergies: string | null;

  @ApiPropertyOptional({ type: [String] })
  tags: string[] | null;

  @ApiPropertyOptional()
  source: string | null;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiProperty()
  consentGiven: boolean;

  @ApiPropertyOptional()
  consentDate: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedPatientsResponseDto {
  @ApiProperty({ type: [PatientResponseDto] })
  data: PatientResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
