import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectMembersService } from './project-members.service.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { ProjectsService } from '../projects/projects.service.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@ApiTags('project-members')
@ApiBearerAuth()
@Controller('projects/:id/members')
@UseGuards(RolesGuard)
export class ProjectMembersController {
  constructor(
    private readonly projectMembersService: ProjectMembersService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Add a member to a project (owner or admin only)',
  })
  @ApiResponse({ status: 201, description: 'Member successfully added' })
  @ApiResponse({ status: 403, description: 'Forbidden - owner or admin only' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  async addMember(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentUser() user: User,
  ) {
    // Verify project exists
    const project = await this.projectsService.findOne(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only owner or admin can add members
    if (project.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the project owner or an admin can add members',
      );
    }

    return this.projectMembersService.addMember(projectId, addMemberDto.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all members of a project' })
  @ApiResponse({ status: 200, description: 'Returns all project members' })
  async getMembers(@Param('id', ParseUUIDPipe) projectId: string) {
    return this.projectMembersService.getMembers(projectId);
  }
}
