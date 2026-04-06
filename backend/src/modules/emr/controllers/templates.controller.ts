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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TemplatesService } from '../services/templates.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { SearchTemplateDto } from '../dto/search-template.dto';

@ApiTags('EMR - Templates')
@Controller('emr/templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list templates with pagination' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchTemplateDto) {
    return this.templatesService.findAll(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  @ApiResponse({ status: 200 })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a template' })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.remove(id);
  }
}
