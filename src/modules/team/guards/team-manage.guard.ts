import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from '../entities/team-member.entity';
import { TeamRole } from '../constants/team-role.enum';
import { TeamPermission } from '../constants/team-permission.enum';
import { resolveTeamPermissions } from '../utils/team-permissions';

@Injectable()
export class TeamManageGuard implements CanActivate {
  constructor(
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const teamId = req.params.teamId;

    if (!user || !teamId) {
      throw new ForbiddenException('팀 권한 확인 실패');
    }

    const member = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: user.id },
      },
      relations: ['customRole'],
    });

    if (!member) {
      throw new ForbiddenException('팀 관리 권한이 없습니다.');
    }
    if (member.role !== TeamRole.OWNER && member.role !== TeamRole.MANAGER) {
      const perms = resolveTeamPermissions(member);
      const hasAny =
        perms.has(TeamPermission.TEAM_INVITE_MEMBER) ||
        perms.has(TeamPermission.TEAM_UPDATE_ROLE) ||
        perms.has(TeamPermission.TEAM_SETTINGS_UPDATE);
      if (!hasAny) {
        throw new ForbiddenException('팀 관리 권한이 없습니다.');
      }
    }

    req.teamMember = member;
    return true;
  }
}
