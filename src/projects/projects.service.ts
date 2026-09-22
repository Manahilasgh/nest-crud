import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
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
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    owner: User,
  ): Promise<Project> {
    // Use transaction to create project and add owner as member atomically
    return this.dataSource.transaction(async (manager) => {
      const project = manager.create(Project, {
        ...createProjectDto,
        ownerId: owner.id,
      });

      const savedProject = await manager.save(Project, project);

      // Automatically add owner as a member
      const ProjectMember = (await import('../project-members/entities/project-member.entity.js')).ProjectMember;
      const member = manager.create(ProjectMember, {
        projectId: savedProject.id,
        userId: owner.id,
      });
      await manager.save(ProjectMember, member);

      return savedProject;
    });
  }

  async findAll(user: User): Promise<Project[]> {
    // Get all project IDs where user is a member
    const ProjectMember = (await import('../project-members/entities/project-member.entity.js')).ProjectMember;
    const memberRepo = this.dataSource.getRepository(ProjectMember);
    
    const memberships = await memberRepo.find({
      where: { userId: user.id },
    });

    const projectIds = memberships.map(m => m.projectId);

    if (projectIds.length === 0) {
      return [];
    }

    // Return projects where user is owner or member
    return this.projectRepository.find({
      where: [
        { ownerId: user.id },
        { id: In(projectIds) },
      ],
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

    // Allow owner or admin to delete projects
    if (project.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the project owner or an admin can delete this project',
      );
    }

    await this.projectRepository.remove(project);
  }
}

