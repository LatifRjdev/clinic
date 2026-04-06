import {
  IsArray,
  IsEnum,
  IsUUID,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../entities/task.entity';

export class BulkAssignTasksDto {
  @ApiProperty({ type: [String], description: 'IDs of tasks to assign' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  taskIds: string[];

  @ApiProperty({ description: 'ID of the user to assign tasks to' })
  @IsUUID()
  assigneeId: string;
}

export class BulkChangeTaskStatusDto {
  @ApiProperty({ type: [String], description: 'IDs of tasks' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  taskIds: string[];

  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}

export class BulkDeleteTasksDto {
  @ApiProperty({ type: [String], description: 'IDs of tasks to delete' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  taskIds: string[];
}
