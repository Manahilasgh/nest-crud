import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { User, UserRole } from '../users/entities/user.entity.js';

/**
 * ProjectsService handles project-related business logic.
 * Demonstrates repository pattern and authorization checks.
 */
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    owner: User,
  ): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      ownerId: owner.id,
    });

    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      relations: {
        owner: true,
      },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: {
        owner: true,
        tasks: {
          assignee: true,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async remove(id: string, user: User): Promise<void> {
    const project = await this.findOne(id);

    // Only admin can delete projects
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete projects');
    }

    await this.projectRepository.remove(project);
  }
}
