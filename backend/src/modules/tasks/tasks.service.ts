import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskComment } from './entities/task-comment.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SearchTasksDto } from './dto/search-tasks.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskComment)
    private readonly taskCommentRepository: Repository<TaskComment>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(createTaskDto);
    return this.taskRepository.save(task);
  }

  async findAll(searchDto: SearchTasksDto) {
    const {
      query,
      status,
      priority,
      assigneeId,
      createdById,
      branchId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.taskRepository.createQueryBuilder('task');

    if (branchId) {
      qb.andWhere('task.branch_id = :branchId', { branchId });
    }

    if (query) {
      const searchTerm = `%${query}%`;
      qb.where(
        new Brackets((bracket) => {
          bracket
            .where('task.title ILIKE :searchTerm', { searchTerm })
            .orWhere('task.description ILIKE :searchTerm', { searchTerm });
        }),
      );
    }

    if (status) {
      qb.andWhere('task.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('task.priority = :priority', { priority });
    }

    if (assigneeId) {
      qb.andWhere('task.assignee_id = :assigneeId', { assigneeId });
    }

    if (createdById) {
      qb.andWhere('task.created_by_id = :createdById', { createdById });
    }

    if (dateFrom) {
      qb.andWhere('task.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('task.created_at <= :dateTo', { dateTo });
    }

    qb.orderBy(`task.${sortBy}`, sortOrder);
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, updateTaskDto);

    if (updateTaskDto.status === TaskStatus.COMPLETED) {
      task.completedAt = new Date();
    }

    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.softRemove(task);
  }

  async assignTask(id: string, assigneeId: string): Promise<Task> {
    const task = await this.findOne(id);
    task.assigneeId = assigneeId;
    return this.taskRepository.save(task);
  }

  async changeStatus(id: string, status: TaskStatus): Promise<Task> {
    const task = await this.findOne(id);
    task.status = status;

    if (status === TaskStatus.COMPLETED) {
      task.completedAt = new Date();
    }

    return this.taskRepository.save(task);
  }

  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { assigneeId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTasksByCreator(createdById: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { createdById },
      order: { createdAt: 'DESC' },
    });
  }

  // --- Bulk operations ---

  async bulkAssign(
    taskIds: string[],
    assigneeId: string,
  ): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of taskIds) {
      try {
        await this.assignTask(id, assigneeId);
        success.push(id);
      } catch (error) {
        failed.push({ id, error: error.message });
      }
    }

    return { success, failed };
  }

  async bulkChangeStatus(
    taskIds: string[],
    status: TaskStatus,
  ): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of taskIds) {
      try {
        await this.changeStatus(id, status);
        success.push(id);
      } catch (error) {
        failed.push({ id, error: error.message });
      }
    }

    return { success, failed };
  }

  async bulkRemove(
    taskIds: string[],
  ): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of taskIds) {
      try {
        await this.remove(id);
        success.push(id);
      } catch (error) {
        failed.push({ id, error: error.message });
      }
    }

    return { success, failed };
  }

  async addComment(taskId: string, createCommentDto: CreateCommentDto): Promise<TaskComment> {
    await this.findOne(taskId);
    const comment = this.taskCommentRepository.create({
      taskId,
      ...createCommentDto,
    });
    return this.taskCommentRepository.save(comment);
  }

  async getComments(taskId: string): Promise<TaskComment[]> {
    await this.findOne(taskId);
    return this.taskCommentRepository.find({
      where: { taskId },
      order: { createdAt: 'ASC' },
    });
  }
}
