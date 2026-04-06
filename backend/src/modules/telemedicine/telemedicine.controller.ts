import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TelemedicineService } from './telemedicine.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('Telemedicine')
@Controller('telemedicine')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TelemedicineController {
  constructor(private readonly telemedicineService: TelemedicineService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new video session' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateSessionDto) {
    return this.telemedicineService.create(dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List video sessions with filters' })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.telemedicineService.findAll({ doctorId, patientId, status, page, limit });
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get a video session by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.telemedicineService.findOne(id);
  }

  @Post('sessions/:id/start')
  @ApiOperation({ summary: 'Start a video session' })
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.telemedicineService.start(id);
  }

  @Post('sessions/:id/end')
  @ApiOperation({ summary: 'End a video session' })
  end(@Param('id', ParseUUIDPipe) id: string) {
    return this.telemedicineService.end(id);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a video session' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.telemedicineService.remove(id);
  }
}
