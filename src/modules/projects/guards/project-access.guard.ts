// src/modules/project/guards/project-access.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '../entities/project-member.entity';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
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

    req.projectMember = member;
    return true;
  }
}