import { IsString, IsArray, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportDataSource {
  APPOINTMENTS = 'appointments',
  PATIENTS = 'patients',
  INVOICES = 'invoices',
  EMR_RECORDS = 'emr_records',
  INVENTORY = 'inventory',
}

export class CustomReportDto {
  @ApiProperty({ enum: ReportDataSource })
  @IsEnum(ReportDataSource)
  dataSource: ReportDataSource;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  columns: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    doctorId?: string;
    status?: string;
    category?: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupBy?: string;
}
