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
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { BranchInterceptor } from '../../common/interceptors/branch.interceptor';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SearchTasksDto } from './dto/search-tasks.dto';
import {
  BulkAssignTasksDto,
  BulkChangeTaskStatusDto,
  BulkDeleteTasksDto,
} from './dto/bulk-tasks.dto';
import { TaskStatus } from './entities/task.entity';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BranchInterceptor)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201 })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list tasks with pagination and filters' })
  @ApiResponse({ status: 200 })
  findAll(@Query() searchDto: SearchTasksDto) {
    return this.tasksService.findAll(searchDto);
  }

  @Post('bulk/assign')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk assign tasks to a user' })
  @ApiResponse({ status: 200 })
  bulkAssign(@Body() dto: BulkAssignTasksDto) {
    return this.tasksService.bulkAssign(dto.taskIds, dto.assigneeId);
  }

  @Post('bulk/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk change task status' })
  @ApiResponse({ status: 200 })
  bulkChangeStatus(@Body() dto: BulkChangeTaskStatusDto) {
    return this.tasksService.bulkChangeStatus(dto.taskIds, dto.status);
  }

  @Post('bulk/delete')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk soft-delete tasks' })
  @ApiResponse({ status: 200 })
  bulkDelete(@Body() dto: BulkDeleteTasksDto) {
    return this.tasksService.bulkRemove(dto.taskIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200 })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a task' })
  @ApiResponse({ status: 204 })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }

  @Post(':id/assign')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a task to a user' })
  @ApiResponse({ status: 200 })
  assignTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assigneeId', ParseUUIDPipe) assigneeId: string,
  ) {
    return this.tasksService.assignTask(id, assigneeId);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Change task status' })
  @ApiResponse({ status: 200 })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.tasksService.changeStatus(id, status);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a task' })
  @ApiResponse({ status: 200 })
  getComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.getComments(id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiResponse({ status: 201 })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.tasksService.addComment(id, createCommentDto);
  }
}
