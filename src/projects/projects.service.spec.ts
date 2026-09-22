import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: Repository<Project>;
  let dataSource: DataSource;

  const mockRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    remove: vi.fn(),
  };

  const mockDataSource = {
    transaction: vi.fn(),
    getRepository: vi.fn(),
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

  const mockProjectOwner: User = {
    ...mockUser,
    id: 'owner-1',
  };

  const mockProject: Project = {
    id: 'project-1',
    title: 'Test Project',
    description: 'Test',
    ownerId: 'owner-1',
    owner: mockProjectOwner,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    repository = module.get<Repository<Project>>(getRepositoryToken(Project));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('remove', () => {
    it('should allow owner to delete their project', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.remove.mockResolvedValue(mockProject);

      await service.remove('project-1', mockProjectOwner);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockProject);
    });

    it('should allow admin to delete any project', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);
      mockRepository.remove.mockResolvedValue(mockProject);

      await service.remove('project-1', mockAdmin);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockProject);
    });

    it('should throw ForbiddenException if user is not owner or admin', async () => {
      mockRepository.findOne.mockResolvedValue(mockProject);

      const otherUser: User = { ...mockUser, id: 'other-user' };

      await expect(service.remove('project-1', otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
