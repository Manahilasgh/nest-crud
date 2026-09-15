import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { UserRole } from '../src/users/entities/user.entity.js';
import { TaskStatus } from '../src/tasks/entities/task.entity.js';

/**
 * E2E Test that validates the full application flow:
 * 1. Register a user
 * 2. Login
 * 3. Create a project
 * 4. Create a task
 * 5. Fetch the task
 * 
 * This demonstrates end-to-end testing with supertest and proves
 * all the NestJS concepts work together correctly.
 */
describe('Task Manager E2E Test', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same global pipes as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Full Application Flow', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'E2E Test User',
          email: 'e2e@example.com',
          password: 'password123',
          role: UserRole.MEMBER,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('e2e@example.com');
      expect(response.body.data.access_token).toBeDefined();

      userId = response.body.data.user.id;
      authToken = response.body.data.access_token;
    });

    it('should login with existing user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'e2e@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('e2e@example.com');
      expect(response.body.data.access_token).toBeDefined();
    });

    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('e2e@example.com');
      expect(response.body.data.password).toBeUndefined(); // Should be excluded
    });

    it('should create a project', async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'E2E Test Project',
          description: 'Testing the full flow',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('E2E Test Project');
      expect(response.body.data.owner).toBeDefined();

      projectId = response.body.data.id;
    });

    it('should get all projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get a project by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(projectId);
      expect(response.body.data.title).toBe('E2E Test Project');
    });

    it('should create a task for the project', async () => {
      const response = await request(app.getHttpServer())
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'E2E Test Task',
          description: 'Testing task creation',
          status: TaskStatus.TODO,
          dueDate: '2026-12-31T00:00:00.000Z',
          assigneeId: userId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('E2E Test Task');
      expect(response.body.data.status).toBe(TaskStatus.TODO);
      expect(response.body.data.assignee).toBeDefined();

      taskId = response.body.data.id;
    });

    it('should get all tasks for the project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toBe('E2E Test Task');
    });

    it('should update task status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: TaskStatus.DONE,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(TaskStatus.DONE);
    });

    it('should delete the task', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Task deleted successfully');
    });

    it('should fail to access protected route without auth token', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .expect(401);
    });

    it('should validate input and reject invalid data', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // Empty title should fail validation
        })
        .expect(400);
    });
  });
});
