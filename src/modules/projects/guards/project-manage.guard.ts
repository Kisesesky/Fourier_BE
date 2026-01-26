// src/modules/project/guards/project-manage.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectRole } from '../constants/project-role.enum';
import { TeamMember } from '../../team/entities/team-member.entity';
import { TeamPermission } from '../../team/constants/team-permission.enum';
import { hasTeamPermission } from '../../team/utils/team-permissions';

@Injectable()
export class ProjectManageGuard implements CanActivate {
  constructor(
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const projectMember = req.projectMember;
    const project = req.project;

    if (!projectMember) {
      throw new ForbiddenException('프로젝트 멤버 정보 없음');
    }

    if (
      projectMember.role !== ProjectRole.OWNER &&
      projectMember.role !== ProjectRole.MANAGER
    ) {
      if (!project) {
        throw new ForbiddenException('프로젝트 관리 권한이 없습니다.');
      }
      const teamMember = await this.teamMemberRepository.findOne({
        where: { team: { id: project.team?.id }, user: { id: req.user?.id } },
        relations: ['customRole'],
      });
      const canManage =
        teamMember &&
        (
          hasTeamPermission(teamMember, TeamPermission.PROJECT_CREATE_DELETE) ||
          hasTeamPermission(teamMember, TeamPermission.PROJECT_INVITE_MEMBER) ||
          hasTeamPermission(teamMember, TeamPermission.PROJECT_UPDATE_ROLE)
        );
      if (!canManage) {
        throw new ForbiddenException('프로젝트 관리 권한이 없습니다.');
      }
    }

    return true;
  }
}
