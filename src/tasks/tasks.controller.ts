import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

/**
 * TasksController handles task endpoints.
 * Demonstrates nested routes (under projects) and PATCH method for partial updates.
 */
@ApiTags('tasks')
@ApiBearerAuth()
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('projects/:id/tasks')
  @ApiOperation({ summary: 'Create a task for a project' })
  @ApiResponse({ status: 201, description: 'Task successfully created' })
  async create(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, createTaskDto);
  }

  @Get('projects/:id/tasks')
  @ApiOperation({ summary: 'Get all tasks for a project' })
  @ApiResponse({ status: 200, description: 'Returns all tasks for the project' })
  async findByProject(@Param('id', ParseUUIDPipe) projectId: string) {
    return this.tasksService.findByProject(projectId);
  }

  @Patch('tasks/:id')
  @ApiOperation({
    summary: 'Update a task (assignee or admin only)',
  })
  @ApiResponse({ status: 200, description: 'Task successfully updated' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only assignee or admin',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete('tasks/:id')
  @ApiOperation({
    summary: 'Delete a task (assignee or admin only)',
  })
  @ApiResponse({ status: 200, description: 'Task successfully deleted' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only assignee or admin',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.tasksService.remove(id, user);
    return { message: 'Task deleted successfully' };
  }
}
