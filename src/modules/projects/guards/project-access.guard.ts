// src/modules/project/guards/project-access.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '../entities/project-member.entity';
import { Project } from '../entities/project.entity';
import { ProjectRole } from '../constants/project-role.enum';
import { ProjectStatus } from '../constants/project-status.enum';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const projectId = req.params.projectId;

    const member = await this.projectMemberRepository.findOne({
      where: {
        project: { id: projectId },
        user: { id: user.id },
      },
    });

    if (!member) {
      throw new ForbiddenException('프로젝트 접근 권한 없음');
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }

    if (project.status === ProjectStatus.DRAFT) {
      if (member.role !== ProjectRole.OWNER && member.role !== ProjectRole.MAINTAINER) {
        throw new ForbiddenException('드래프트 프로젝트 접근 권한 없음');
      }
    }

    if (project.status === ProjectStatus.DISABLED) {
      if (member.role !== ProjectRole.OWNER) {
        throw new ForbiddenException('비활성 프로젝트 접근 권한 없음');
      }
    }

    req.projectMember = member;
    req.project = project;
    return true;
  }
}
