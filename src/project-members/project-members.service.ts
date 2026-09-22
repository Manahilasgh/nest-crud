import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from './entities/project-member.entity.js';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  async addMember(projectId: string, userId: string): Promise<ProjectMember> {
    // Check if already a member
    const existing = await this.projectMemberRepository.findOne({
      where: { projectId, userId },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    const member = this.projectMemberRepository.create({
      projectId,
      userId,
    });

    return this.projectMemberRepository.save(member);
  }

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    return this.projectMemberRepository.find({
      where: { projectId },
      relations: {
        user: true,
      },
    });
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId },
    });
    return !!member;
  }
}
