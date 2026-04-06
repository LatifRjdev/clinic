import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientDto } from './dto/search-patient.dto';
import {
  PatientResponseDto,
  PaginatedPatientsResponseDto,
} from './dto/patient-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, type: PatientResponseDto })
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list patients with pagination' })
  @ApiResponse({ status: 200, type: PaginatedPatientsResponseDto })
  findAll(@Query() searchDto: SearchPatientDto) {
    return this.patientsService.findAll(searchDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Autocomplete search for patients' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 chars)' })
  @ApiResponse({ status: 200, type: [PatientResponseDto] })
  search(@Query('q') query: string) {
    return this.patientsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by ID' })
  @ApiResponse({ status: 200, type: PatientResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get patient visit history' })
  @ApiResponse({ status: 200 })
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.getHistory(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get patient timeline' })
  @ApiResponse({ status: 200 })
  getTimeline(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.getTimeline(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a patient' })
  @ApiResponse({ status: 200, type: PatientResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Post(':id/consent')
  @ApiOperation({ summary: 'Record patient consent' })
  @ApiResponse({ status: 200, type: PatientResponseDto })
  recordConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('consentGiven') consentGiven: boolean,
  ) {
    return this.patientsService.recordConsent(id, consentGiven);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a patient' })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.remove(id);
  }

  @Post(':id/photo')
  @ApiOperation({ summary: 'Upload patient photo' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new BadRequestException('Только изображения'), false);
      },
    }),
  )
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Файл не предоставлен');
    return this.patientsService.uploadPhoto(id, file);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export patients to CSV' })
  async exportCsv(@Res() res: Response) {
    const csv = await this.patientsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=patients.csv');
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8
  }

  @Post('import/csv')
  @ApiOperation({ summary: 'Import patients from CSV with duplicate handling' })
  @ApiQuery({
    name: 'mode',
    required: false,
    enum: ['skip', 'update', 'create-anyway'],
    description: 'How to handle duplicates (default: skip)',
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Query('mode') mode?: 'skip' | 'update' | 'create-anyway',
  ) {
    if (!file) throw new BadRequestException('CSV файл не предоставлен');
    const validModes = ['skip', 'update', 'create-anyway'];
    const importMode = mode && validModes.includes(mode) ? mode : 'skip';
    const content = file.buffer.toString('utf-8');
    return this.patientsService.importCsv(content, importMode);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge duplicate patients' })
  merge(@Body() body: { primaryId: string; duplicateIds: string[] }) {
    return this.patientsService.merge(body.primaryId, body.duplicateIds);
  }
}
