import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { UserRole } from '../src/users/entities/user.entity.js';
import { TaskStatus } from '../src/tasks/entities/task.entity.js';

/**
 * E2E Test that validates the full application flow:
 * 1. Register users
 * 2. Login
 * 3. Create a project
 * 4. Add members
 * 5. Create tasks
 * 6. Test authorization rules
 * 
 * This demonstrates end-to-end testing with supertest and proves
 * all the NestJS concepts work together correctly.
 */
describe('Task Manager E2E Test', () => {
  let app: INestApplication;
  let authToken: string;
  let member2Token: string;
  let nonMemberToken: string;
  let userId: string;
  let member2Id: string;
  let nonMemberId: string;
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

  describe('Full Application Flow with Authorization', () => {
    it('should register first user (project owner)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'E2E Owner',
          email: 'e2e-owner@example.com',
          password: 'password123',
          role: UserRole.MEMBER,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.access_token).toBeDefined();

      userId = response.body.data.user.id;
      authToken = response.body.data.access_token;
    });

    it('should register second user (will be added as member)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'E2E Member',
          email: 'e2e-member@example.com',
          password: 'password123',
          role: UserRole.MEMBER,
        })
        .expect(201);

      member2Id = response.body.data.user.id;
      member2Token = response.body.data.access_token;
    });

    it('should register third user (non-member)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'E2E Non-Member',
          email: 'e2e-nonmember@example.com',
          password: 'password123',
          role: UserRole.MEMBER,
        })
        .expect(201);

      nonMemberId = response.body.data.user.id;
      nonMemberToken = response.body.data.access_token;
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

      projectId = response.body.data.id;
    });

    it('should add member2 to the project', async () => {
      const response = await request(app.getHttpServer())
        .post(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: member2Id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should get project members', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // Owner + member2
    });

    it('should allow member to create a task', async () => {
      const response = await request(app.getHttpServer())
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'E2E Test Task',
          description: 'Testing task creation',
          status: TaskStatus.TODO,
          dueDate: '2026-12-31T00:00:00.000Z',
          assigneeId: member2Id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('E2E Test Task');
      
      taskId = response.body.data.id;
    });

    it('should block non-member from creating a task', async () => {
      await request(app.getHttpServer())
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({
          title: 'Unauthorized Task',
          description: 'Should fail',
          assigneeId: userId,
        })
        .expect(403);
    });

    it('should block assigning task to non-member', async () => {
      await request(app.getHttpServer())
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Bad Assignee Task',
          description: 'Should fail',
          assigneeId: nonMemberId,
        })
        .expect(400);
    });

    it('should allow task creator (not assignee) to edit their task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: TaskStatus.IN_PROGRESS,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should allow task assignee to edit the task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${member2Token}`)
        .send({
          status: TaskStatus.DONE,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(TaskStatus.DONE);
    });

    it('should block non-member from editing the task', async () => {
      await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({
          description: 'Trying to hack',
        })
        .expect(403);
    });

    it('should allow task creator to delete their task', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow owner (non-admin) to delete their project', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should only show projects user owns or is member of', async () => {
      // Non-member creates their own project
      const createResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({
          title: 'Non-Member Project',
          description: 'Private project',
        })
        .expect(201);

      const nonMemberProjectId = createResponse.body.data.id;

      // First user should NOT see non-member's project
      const listResponse = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const projectIds = listResponse.body.data.map((p: any) => p.id);
      expect(projectIds).not.toContain(nonMemberProjectId);

      // Clean up
      await request(app.getHttpServer())
        .delete(`/projects/${nonMemberProjectId}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(200);
    });

    it('should block non-owner non-admin from deleting project', async () => {
      // Member2 creates a project
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${member2Token}`)
        .send({
          title: 'Member2 Project',
          description: 'Test',
        })
        .expect(201);

      const member2ProjectId = response.body.data.id;

      // First user tries to delete it (should fail)
      await request(app.getHttpServer())
        .delete(`/projects/${member2ProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Clean up - owner can delete
      await request(app.getHttpServer())
        .delete(`/projects/${member2ProjectId}`)
        .set('Authorization', `Bearer ${member2Token}`)
        .expect(200);
    });
  });
});
