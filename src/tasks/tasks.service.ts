import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { User, UserRole } from '../users/entities/user.entity.js';

/**
 * TasksService handles task-related business logic.
 * Demonstrates complex authorization logic (assignee or admin can update).
 */
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(
    projectId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      projectId,
    });

    return this.taskRepository.save(task);
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { projectId },
      relations: {
        assignee: true,
        project: true,
      },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: {
        assignee: true,
        project: {
          owner: true,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(id);

    // Only the assignee or admin can update the task
    if (task.assigneeId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the assignee or an admin can update this task',
      );
    }

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id);

    // Only the assignee or admin can delete the task
    if (task.assigneeId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the assignee or an admin can delete this task',
      );
    }

    await this.taskRepository.remove(task);
  }
}
