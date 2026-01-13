import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from '../entities/team-member.entity';
import { TeamRole } from '../constants/team-role.enum';

@Injectable()
export class TeamOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const teamId = req.params.teamId;

    if (!user || !teamId) {
      throw new ForbiddenException('잘못된 접근입니다.');
    }

    const member = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: user.id },
        role: TeamRole.OWNER,
      },
    });

    if (!member) {
      throw new ForbiddenException('팀 오너 권한이 필요합니다.');
    }

    // 필요하면 이후 확장 가능
    req.teamMember = member;

    return true;
  }
}