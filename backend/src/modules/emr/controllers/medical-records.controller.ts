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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BranchInterceptor } from '../../../common/interceptors/branch.interceptor';
import { MedicalRecordsService } from '../services/medical-records.service';
import { CreateMedicalRecordDto } from '../dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from '../dto/update-medical-record.dto';
import { AmendMedicalRecordDto } from '../dto/amend-medical-record.dto';
import { SearchMedicalRecordDto } from '../dto/search-medical-record.dto';
import { StorageService } from '../../storage/storage.service';
import { UserRole } from '../../../common/enums/roles.enum';

@ApiTags('EMR - Medical Records')
@Controller('emr/records')
@UseGuards(JwtAuthGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class MedicalRecordsController {
  private readonly bypassRoles = [UserRole.OWNER, UserRole.SYSADMIN, UserRole.CHIEF_DOCTOR, UserRole.ADMIN];

  constructor(
    private readonly medicalRecordsService: MedicalRecordsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new medical record' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list medical records with pagination' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchMedicalRecordDto) {
    return this.medicalRecordsService.findAll(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a medical record by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a medical record' })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicalRecordDto,
    @Req() req: { user: { id: string; role: string } },
  ) {
    const userId = this.bypassRoles.includes(req.user.role as UserRole) ? undefined : req.user.id;
    return this.medicalRecordsService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a medical record' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user: { id: string; role: string } }) {
    const userId = this.bypassRoles.includes(req.user.role as UserRole) ? undefined : req.user.id;
    return this.medicalRecordsService.remove(id, userId);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Sign a medical record with electronic signature' })
  @ApiResponse({ status: 200 })
  sign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { signatureImage?: string },
    @Req() req: { user: { id: string; role: string } },
  ) {
    const userId = this.bypassRoles.includes(req.user.role as UserRole) ? undefined : req.user.id;
    return this.medicalRecordsService.sign(id, userId, { signatureImage: body?.signatureImage });
  }

  @Post(':id/amend')
  @ApiOperation({ summary: 'Amend a signed medical record with audit trail' })
  @ApiResponse({ status: 200 })
  amend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AmendMedicalRecordDto,
    @Req() req: { user: { id: string; role: string } },
  ) {
    const userId = this.bypassRoles.includes(req.user.role as UserRole) ? undefined : req.user.id;
    return this.medicalRecordsService.amend(id, dto, userId);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Attach file to medical record' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async addAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: { id: string; role: string } },
  ) {
    if (!file) throw new BadRequestException('Файл не предоставлен');
    const userId = this.bypassRoles.includes(req.user.role as UserRole) ? undefined : req.user.id;
    const result = await this.storageService.upload(file, 'emr/attachments');
    const record = await this.medicalRecordsService.findOne(id);
    const attachments = record.attachments || [];
    attachments.push({
      key: result.key,
      name: result.originalName,
      mimeType: result.mimeType,
      size: result.size,
      uploadedAt: new Date().toISOString(),
    });
    return this.medicalRecordsService.update(id, { attachments } as any, userId);
  }
}
