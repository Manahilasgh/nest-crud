import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { Task } from './entities/task.entity.js';
import { ProjectMembersModule } from '../project-members/project-members.module.js';
import { ProjectsModule } from '../projects/projects.module.js';

/**
 * TasksModule encapsulates task-related functionality.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    ProjectMembersModule,
    ProjectsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
