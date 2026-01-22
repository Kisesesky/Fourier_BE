// src/modules/project/project.controller.ts
import { Controller, Post, Param, Body, UseGuards, Get, Patch, Delete } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectManageGuard } from './guards/project-manage.guard';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';

@ApiTags('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('team/:teamId/project')
export class ProjectsController {
  constructor(
    private readonly projectService: ProjectsService
  ) {}

  @ApiOperation({ summary: '팀 프로젝트 목록' })
  @ApiOkResponse({ type: [ProjectResponseDto] })
  @Get()
  async getProjects(@Param('teamId') teamId: string) {
    return this.projectService.getProjects(teamId);
  }

  @ApiOperation({ summary: '프로젝트 추가'})
  @ApiOkResponse({ type: ProjectResponseDto })
  @Post()
  create(
    @Param('teamId') teamId: string,
    @Body() createProjectDto: CreateProjectDto,
    @RequestUser() user: User,
  ) {
    return this.projectService.createProject(teamId, createProjectDto, user);
  }

  @ApiOperation({ summary: '프로젝트 멤버 추가'})
  @UseGuards(ProjectAccessGuard, ProjectManageGuard)
  @Post(':projectId/member')
  addMember(
    @Param('projectId') projectId: string,
    @Body() addProjcetMemberDto: AddProjectMemberDto,
  ) {
    return this.projectService.addProjectMember(
      projectId,
      addProjcetMemberDto.userId,
      addProjcetMemberDto.role,
    );
  }

  @ApiOperation({ summary: '프로젝트 멤버 가져오기'})
  @ApiOkResponse({ type: [ProjectMemberResponseDto] })
  @UseGuards(ProjectAccessGuard)
  @Get(':projectId/members')
  getMembers(
    @Param('projectId') projectId: string
  ) {
    return this.projectService.getProjectMembers(projectId);
  }

  @ApiOperation({ summary: '프로젝트 멤버 롤 수정'})
  @UseGuards(ProjectAccessGuard, ProjectManageGuard)
  @Patch(':projectId/member')
  updateMemberRole(
    @Param('projectId') projectId: string,
    @Body() updateProjectMemberDto: UpdateProjectMemberDto,
  ) {
    return this.projectService.updateMemberRole(
      projectId,
      updateProjectMemberDto.userId,
      updateProjectMemberDto.role,
    );
  }

  @ApiOperation({ summary: '프로젝트 멤버 삭제'})
  @UseGuards(ProjectAccessGuard, ProjectManageGuard)
  @Delete(':projectId/member/:userId')
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectService.removeMember(projectId, userId);
  }

  @ApiOperation({ summary: '프로젝트 수정'})
  @UseGuards(ProjectAccessGuard, ProjectManageGuard)
  @Patch(':projectId')
  updateProject(
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(projectId, updateProjectDto);
  }
}