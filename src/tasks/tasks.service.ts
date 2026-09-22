import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { ProjectMembersService } from '../project-members/project-members.service.js';
import { ProjectsService } from '../projects/projects.service.js';

/**
 * TasksService handles task-related business logic.
 * Demonstrates complex authorization logic (creator, assignee or admin can update).
 */
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly projectMembersService: ProjectMembersService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(
    projectId: string,
    createTaskDto: CreateTaskDto,
    currentUser: User,
  ): Promise<Task> {
    // Verify project exists
    const project = await this.projectsService.findOne(projectId);

    // Check if current user is a member or owner of the project
    const isOwner = project.ownerId === currentUser.id;
    const isMember = await this.projectMembersService.isMember(
      projectId,
      currentUser.id,
    );

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You must be a member or owner of the project to create tasks',
      );
    }

    // Verify assignee is a member of the project
    const assigneeIsMember = await this.projectMembersService.isMember(
      projectId,
      createTaskDto.assigneeId,
    );

    if (!assigneeIsMember) {
      throw new BadRequestException(
        'Assignee must be a member of the project',
      );
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      projectId,
      createdById: currentUser.id,
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
        createdBy: true,
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

    // Allow creator, assignee, or admin to update the task
    if (
      task.createdById !== user.id &&
      task.assigneeId !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only the creator, assignee, or an admin can update this task',
      );
    }

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id);

    // Allow creator, assignee, or admin to delete the task
    if (
      task.createdById !== user.id &&
      task.assigneeId !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only the creator, assignee, or an admin can delete this task',
      );
    }

    await this.taskRepository.remove(task);
  }
}
