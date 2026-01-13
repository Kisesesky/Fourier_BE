import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectMember } from '../../projects/entities/project-member.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly repo: Repository<ProjectMember>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const projectId = req.params.projectId;

    const member = await this.repo.findOne({
      where: { project: { id: projectId }, user: { id: user.id } },
    });

    if (!member) throw new ForbiddenException('프로젝트 멤버가 아님');
    req.projectMember = member;
    return true;
  }
}