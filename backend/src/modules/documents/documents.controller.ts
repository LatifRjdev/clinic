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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { SearchDocumentsDto } from './dto/search-documents.dto';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.DOCTOR, UserRole.CHIEF_DOCTOR)
  @ApiOperation({ summary: 'Create a new document' })
  @ApiResponse({ status: 201 })
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list documents with pagination' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchDocumentsDto) {
    return this.documentsService.findAll(searchDto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List all active document templates' })
  @ApiResponse({ status: 200 })
  findAllTemplates() {
    return this.documentsService.findAllTemplates();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a document template by ID' })
  @ApiResponse({ status: 200 })
  findOneTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOneTemplate(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document file' })
  @ApiResponse({ status: 200, description: 'Returns the file URL for download' })
  async download(@Param('id', ParseUUIDPipe) id: string) {
    const document = await this.documentsService.findOne(id);
    return { fileUrl: document.fileUrl, mimeType: document.mimeType };
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.DOCTOR, UserRole.CHIEF_DOCTOR)
  @ApiOperation({ summary: 'Update a document' })
  @ApiResponse({ status: 200 })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Partial<CreateDocumentDto>,
  ) {
    return this.documentsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.DOCTOR, UserRole.CHIEF_DOCTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a document' })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }

  @Post('generate-pdf')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.DOCTOR, UserRole.CHIEF_DOCTOR)
  @ApiOperation({ summary: 'Generate a PDF from a template' })
  @ApiResponse({ status: 201, description: 'Returns the generated file path' })
  generatePdf(
    @Body() body: { templateId: string; variables: Record<string, any> },
  ) {
    return this.documentsService.generatePdf(body.templateId, body.variables);
  }
}
