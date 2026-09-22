import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './entities/task.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ProjectMembersService } from '../project-members/project-members.service';
import { ProjectsService } from '../projects/projects.service';
import { Project } from '../projects/entities/project.entity';

/**
 * Unit test for TasksService.
 * Demonstrates mocking repositories and testing service logic in isolation.
 */
describe('TasksService', () => {
  let service: TasksService;
  let repository: Repository<Task>;
  let projectMembersService: ProjectMembersService;
  let projectsService: ProjectsService;

  const mockRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    remove: vi.fn(),
  };

  const mockProjectMembersService = {
    isMember: vi.fn(),
  };

  const mockProjectsService = {
    findOne: vi.fn(),
  };

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed',
    role: UserRole.MEMBER,
    ownedProjects: [],
    assignedTasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin: User = {
    ...mockUser,
    id: 'admin-1',
    role: UserRole.ADMIN,
  };

  const mockCreator: User = {
    ...mockUser,
    id: 'creator-1',
  };

  const mockAssignee: User = {
    ...mockUser,
    id: 'assignee-1',
  };

  const mockProject: Project = {
    id: 'project-1',
    title: 'Test Project',
    description: 'Test',
    ownerId: 'user-1',
    owner: mockUser,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    dueDate: new Date(),
    projectId: 'project-1',
    project: null,
    assigneeId: 'assignee-1',
    assignee: mockAssignee,
    createdById: 'creator-1',
    createdBy: mockCreator,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
        {
          provide: ProjectMembersService,
          useValue: mockProjectMembersService,
        },
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
    projectMembersService = module.get<ProjectMembersService>(ProjectMembersService);
    projectsService = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task when user is a member', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.TODO,
        assigneeId: 'assignee-1',
        dueDate: '2026-12-31T00:00:00.000Z',
      };

      mockProjectsService.findOne.mockResolvedValue(mockProject);
      mockProjectMembersService.isMember.mockResolvedValue(true);
      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.create('project-1', createTaskDto, mockUser);

      expect(mockProjectsService.findOne).toHaveBeenCalledWith('project-1');
      expect(mockProjectMembersService.isMember).toHaveBeenCalledWith('project-1', 'user-1');
      expect(mockProjectMembersService.isMember).toHaveBeenCalledWith('project-1', 'assignee-1');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      const projectOwnedByOther = {
        ...mockProject,
        ownerId: 'other-owner-id', // User is not the owner
      };
      
      mockProjectsService.findOne.mockResolvedValue(projectOwnedByOther);
      mockProjectMembersService.isMember
        .mockResolvedValueOnce(false); // Current user is not a member

      await expect(
        service.create('project-1', {
          title: 'New Task',
          assigneeId: 'assignee-1',
        } as any, mockUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if assignee is not a member', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);
      mockProjectMembersService.isMember
        .mockResolvedValueOnce(true) // Current user is a member
        .mockResolvedValueOnce(false); // Assignee is not a member

      await expect(
        service.create('project-1', {
          title: 'New Task',
          assigneeId: 'non-member',
        } as any, mockUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return a task if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        relations: {
          assignee: true,
          createdBy: true,
          project: {
            owner: true,
          },
        },
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should allow creator to update their task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.DONE,
      });

      const updateDto = { status: TaskStatus.DONE };
      const result = await service.update('task-1', updateDto, mockCreator);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.status).toEqual(TaskStatus.DONE);
    });

    it('should allow assignee to update their task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.DONE,
      });

      const updateDto = { status: TaskStatus.DONE };
      const result = await service.update('task-1', updateDto, mockAssignee);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.status).toEqual(TaskStatus.DONE);
    });

    it('should allow admin to update any task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.DONE,
      });

      const updateDto = { status: TaskStatus.DONE };
      const result = await service.update('task-1', updateDto, mockAdmin);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.status).toEqual(TaskStatus.DONE);
    });

    it('should throw ForbiddenException if user is not creator, assignee, or admin', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);

      const otherUser: User = { ...mockUser, id: 'other-user' };
      const updateDto = { status: TaskStatus.DONE };

      await expect(
        service.update('task-1', updateDto, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should allow creator to delete their task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await service.remove('task-1', mockCreator);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should allow assignee to delete their task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await service.remove('task-1', mockAssignee);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should allow admin to delete any task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await service.remove('task-1', mockAdmin);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw ForbiddenException if user is not creator, assignee, or admin', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);

      const otherUser: User = { ...mockUser, id: 'other-user' };

      await expect(service.remove('task-1', otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
