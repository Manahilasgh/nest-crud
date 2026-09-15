import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { UsersService } from '../users/users.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { TasksService } from '../tasks/tasks.service.js';
import { AuthService } from '../auth/auth.service.js';
import { UserRole } from '../users/entities/user.entity.js';
import { TaskStatus } from '../tasks/entities/task.entity.js';
import { Logger } from '@nestjs/common';

/**
 * Database seed script that creates sample data.
 * Demonstrates how to use services programmatically outside of the HTTP context.
 */
async function seed() {
  const logger = new Logger('Seed');
  logger.log('🌱 Starting database seed...');

  const app = await NestFactory.createApplicationContext(AppModule);

  const authService = app.get(AuthService);
  const usersService = app.get(UsersService);
  const projectsService = app.get(ProjectsService);
  const tasksService = app.get(TasksService);

  try {
    // Create users
    logger.log('Creating users...');

    const adminResult = await authService.register({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: UserRole.ADMIN,
    });
    const admin = await usersService.findById(adminResult.user.id);
    if (!admin) throw new Error('Failed to create admin user');
    logger.log(`Created admin: ${admin.email}`);

    const member1Result = await authService.register({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: UserRole.MEMBER,
    });
    const member1 = await usersService.findById(member1Result.user.id);
    if (!member1) throw new Error('Failed to create member 1');
    logger.log(`Created member: ${member1.email}`);

    const member2Result = await authService.register({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: UserRole.MEMBER,
    });
    const member2 = await usersService.findById(member2Result.user.id);
    if (!member2) throw new Error('Failed to create member 2');
    logger.log(`Created member: ${member2.email}`);

    // Create projects
    logger.log('Creating projects...');

    const project1 = await projectsService.create(
      {
        title: 'Website Redesign',
        description: 'Complete redesign of the company website',
      },
      admin,
    );
    logger.log(`Created project: ${project1.title}`);

    const project2 = await projectsService.create(
      {
        title: 'Mobile App Development',
        description: 'Build a new mobile app for iOS and Android',
      },
      member1,
    );
    logger.log(`Created project: ${project2.title}`);

    // Create tasks
    logger.log('Creating tasks...');

    const task1 = await tasksService.create(project1.id, {
      title: 'Design homepage mockup',
      description: 'Create a modern mockup for the homepage',
      status: TaskStatus.IN_PROGRESS,
      dueDate: '2026-10-01T00:00:00.000Z',
      assigneeId: member1.id,
    });
    logger.log(`Created task: ${task1.title}`);

    const task2 = await tasksService.create(project1.id, {
      title: 'Implement responsive navigation',
      description: 'Make the navigation menu mobile-friendly',
      status: TaskStatus.TODO,
      dueDate: '2026-10-15T00:00:00.000Z',
      assigneeId: member2.id,
    });
    logger.log(`Created task: ${task2.title}`);

    const task3 = await tasksService.create(project2.id, {
      title: 'Set up React Native project',
      description: 'Initialize the mobile app project with React Native',
      status: TaskStatus.DONE,
      dueDate: '2026-09-20T00:00:00.000Z',
      assigneeId: member1.id,
    });
    logger.log(`Created task: ${task3.title}`);

    const task4 = await tasksService.create(project2.id, {
      title: 'Design app screens',
      description: 'Create UI/UX designs for all app screens',
      status: TaskStatus.TODO,
      dueDate: '2026-11-01T00:00:00.000Z',
      assigneeId: member2.id,
    });
    logger.log(`Created task: ${task4.title}`);

    logger.log('✅ Database seed completed successfully!');
    logger.log('\n📝 Test credentials:');
    logger.log('   Admin: admin@example.com / password123');
    logger.log('   User1: john@example.com / password123');
    logger.log('   User2: jane@example.com / password123');
  } catch (error) {
    logger.error('❌ Error seeding database:', (error as Error).message);
    throw error;
  } finally {
    await app.close();
  }
}

seed();
