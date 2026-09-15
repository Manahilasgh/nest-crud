import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service.js';
import { Task, TaskStatus } from './entities/task.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

/**
 * Unit test for TasksService.
 * Demonstrates mocking repositories and testing service logic in isolation.
 */
describe('TasksService', () => {
  let service: TasksService;
  let repository: Repository<Task>;

  const mockRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    remove: vi.fn(),
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

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    dueDate: new Date(),
    projectId: 'project-1',
    project: null,
    assigneeId: 'user-1',
    assignee: mockUser,
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
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.TODO,
        assigneeId: 'user-1',
        dueDate: '2026-12-31T00:00:00.000Z',
      };

      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await service.create('project-1', createTaskDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        projectId: 'project-1',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual(mockTask);
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
    it('should allow assignee to update their task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.DONE,
      });

      const updateDto = { status: TaskStatus.DONE };
      const result = await service.update('task-1', updateDto, mockUser);

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

    it('should throw ForbiddenException if user is not assignee or admin', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);

      const otherUser: User = { ...mockUser, id: 'other-user' };
      const updateDto = { status: TaskStatus.DONE };

      await expect(
        service.update('task-1', updateDto, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should allow assignee to delete their task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await service.remove('task-1', mockUser);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should allow admin to delete any task', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await service.remove('task-1', mockAdmin);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw ForbiddenException if user is not assignee or admin', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);

      const otherUser: User = { ...mockUser, id: 'other-user' };

      await expect(service.remove('task-1', otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
