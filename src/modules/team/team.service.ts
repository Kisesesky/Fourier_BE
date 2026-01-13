// src/modules/team/team.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { TeamInvite } from './entities/team-invite.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/constants/notification-type.enum';
import { TeamInviteStatus } from './constants/team-invite-status.enum';
import { TeamRole } from './constants/team-role.enum';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(TeamInvite)
    private readonly teamInviteRepository: Repository<TeamInvite>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async createTeam(workspaceId: string, createTeamDto: CreateTeamDto, user: User) {
    const { name, iconType, iconValue } = createTeamDto;
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new ForbiddenException('워크스페이스 권한 없음');
    }

    const team = this.teamRepository.create({
      name,
      iconType,
      iconValue,
      workspace: { id: workspace.id } as Workspace,
    });

    await this.teamRepository.save(team);

    const owner = this.teamMemberRepository.create({
      team: { id: team.id } as Team,
      user: { id: user.id } as User,
      role: TeamRole.OWNER,
    });

    await this.teamMemberRepository.save(owner);

    return team;
  }

  async getTeams(workspaceId: string, user: User) {
    return this.teamRepository
      .createQueryBuilder('team')
      .innerJoin('team.workspace', 'workspace')
      .innerJoin('team.members', 'member')
      .where('workspace.id = :workspaceId', { workspaceId })
      .andWhere('member.userId = :userId', { userId: user.id })
      .getMany();
  }

  async inviteMember( teamId: string, inviter: User, inviteeId: string ) {
    if (inviter.id == inviteeId) {
      throw new ConflictException('자기 자신을 초대할 수 없습니다.');
    }
    const member = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: inviter.id },
        role: TeamRole.OWNER,
      },
      relations: ['team'],
    });

    if (!member) {
      throw new ForbiddenException('팀 오너만 초대할 수 있습니다.');
    }

    const alreadyMember = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: inviteeId },
      },
    });

    if (alreadyMember) {
      throw new ConflictException('이미 해당 유저가 팀 멤버입니다.');
    }

    const invitee = await this.usersRepository.findOne({
      where: { id: inviteeId },
    });
    if (!invitee) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    const exists = await this.teamInviteRepository.findOne({
      where: {
        team: { id: teamId },
        invitee: { id: inviteeId },
        status: TeamInviteStatus.PENDING,
      },
    });

    if (exists) {
      throw new ConflictException('이미 초대된 사용자입니다.');
    }

    const invite = await this.teamInviteRepository.save(
      this.teamInviteRepository.create({
        team: { id: teamId },
        inviter,
        invitee,
      }),
    );

    await this.notificationService.create({
      user: invitee,
      type: NotificationType.INVITE,
      payload: {
        teamId,
        teamName: member.team.name,
        inviterName: inviter.displayName ?? inviter.name,
        inviteId: invite.id,
      }
    })

    return invite;
  }

  async acceptInvite(inviteId: string, user: User) {
    const invite = await this.teamInviteRepository.findOne({
      where: {
        id: inviteId,
        invitee: { id: user.id },
        status: TeamInviteStatus.PENDING,
      },
      relations: ['team'],
    });

    if (!invite) {
      throw new NotFoundException('초대를 찾을 수 없습니다.');
    }

    invite.status = TeamInviteStatus.ACCEPTED;
    await this.teamInviteRepository.save(invite);

    const member = this.teamMemberRepository.create({
      team: invite.team,
      user,
      role: TeamRole.MEMBER,
    });

    await this.teamMemberRepository.save(member);

    await this.notificationService.markInviteHandled(invite.id, user.id);

    return { success: true };
  }

  async rejectInvite(inviteId: string, user: User) {
    const invite = await this.teamInviteRepository.findOne({
      where: {
        id: inviteId,
        invitee: { id: user.id },
        status: TeamInviteStatus.PENDING,
      },
    });

    if (!invite) {
      throw new NotFoundException('초대를 찾을 수 없습니다.');
    }

    invite.status = TeamInviteStatus.REJECTED;
    await this.teamInviteRepository.save(invite);

    await this.notificationService.markInviteHandled(invite.id, user.id);

    return { success: true };
  }
}