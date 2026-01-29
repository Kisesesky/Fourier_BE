// src/modules/team/team.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { WorkspaceMember } from '../workspace/entities/workspace-member.entity';
import { WorkspaceRole } from '../workspace/constants/workspace-role.enum';
import { TeamInvite } from './entities/team-invite.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/constants/notification-type.enum';
import { TeamInviteStatus } from './constants/team-invite-status.enum';
import { TeamRole } from './constants/team-role.enum';
import { TeamRolePolicy } from './entities/team-role-policy.entity';
import { TeamPermission } from './constants/team-permission.enum';
import { hasTeamPermission } from './utils/team-permissions';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(TeamRolePolicy)
    private readonly teamRolePolicyRepository: Repository<TeamRolePolicy>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(TeamInvite)
    private readonly teamInviteRepository: Repository<TeamInvite>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async createTeam(workspaceId: string, createTeamDto: CreateTeamDto, user: User) {
    const { name, iconType, iconValue } = createTeamDto;
    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspace: { id: workspaceId },
        user: { id: user.id },
      },
    });
    let workspace: Workspace | null = null;
    if (!member) {
      workspace = await this.workspaceRepository.findOne({
        where: {
          id: workspaceId,
          createdBy: { id: user.id },
        },
      });
      if (workspace) {
        await this.workspaceMemberRepository.save(
          this.workspaceMemberRepository.create({
            workspace: { id: workspace.id } as Workspace,
            user: { id: user.id } as User,
            role: WorkspaceRole.OWNER,
          }),
        );
      }
    } else if ([WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(member.role)) {
      workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    }

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

  async getTeamMembers(teamId: string) {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['members', 'members.user', 'members.customRole'],
    });

    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    return team.members.map((member) => ({
      userId: member.user.id,
      name: member.user.name,
      displayName: member.user.displayName ?? member.user.name,
      nickname: member.nickname ?? null,
      email: member.user.email,
      avatarUrl: member.user.avatarUrl,
      teamAvatarUrl: member.avatarUrl ?? null,
      role: member.role,
      customRoleId: member.customRole?.id ?? null,
      customRoleName: member.customRole?.name ?? null,
    }));
  }

  async getCustomRoles(teamId: string) {
    const roles = await this.teamRolePolicyRepository.find({
      where: { team: { id: teamId }, isSystem: false },
      order: { createdAt: 'DESC' },
    });
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description ?? null,
      permissions: role.permissions ?? [],
    }));
  }

  async createCustomRole(teamId: string, actor: User, name: string, description: string | undefined, permissions: string[]) {
    const member = await this.teamMemberRepository.findOne({
      where: { team: { id: teamId }, user: { id: actor.id } },
      relations: ['customRole'],
    });
    if (!member || !hasTeamPermission(member, TeamPermission.TEAM_UPDATE_ROLE)) {
      throw new ForbiddenException('팀 관리자만 역할을 생성할 수 있습니다.');
    }
    const count = await this.teamRolePolicyRepository.count({
      where: { team: { id: teamId }, isSystem: false },
    });
    if (count >= 5) {
      throw new ConflictException('커스텀 역할은 팀당 최대 5개까지 생성할 수 있습니다.');
    }
    const role = this.teamRolePolicyRepository.create({
      team: { id: teamId } as Team,
      name,
      description: description ?? null,
      permissions,
      isSystem: false,
    });
    const saved = await this.teamRolePolicyRepository.save(role);
    return { id: saved.id, name: saved.name, description: saved.description ?? null, permissions: saved.permissions ?? [] };
  }

  async updateCustomRole(teamId: string, roleId: string, actor: User, name?: string, description?: string, permissions?: string[]) {
    const member = await this.teamMemberRepository.findOne({
      where: { team: { id: teamId }, user: { id: actor.id } },
      relations: ['customRole'],
    });
    if (!member || !hasTeamPermission(member, TeamPermission.TEAM_UPDATE_ROLE)) {
      throw new ForbiddenException('팀 관리자만 역할을 수정할 수 있습니다.');
    }
    const role = await this.teamRolePolicyRepository.findOne({
      where: { id: roleId, team: { id: teamId } },
    });
    if (!role || role.isSystem) {
      throw new NotFoundException('커스텀 역할을 찾을 수 없습니다.');
    }
    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;
    const saved = await this.teamRolePolicyRepository.save(role);
    return { id: saved.id, name: saved.name, description: saved.description ?? null, permissions: saved.permissions ?? [] };
  }

  async deleteCustomRole(teamId: string, roleId: string, actor: User) {
    const member = await this.teamMemberRepository.findOne({
      where: { team: { id: teamId }, user: { id: actor.id } },
      relations: ['customRole'],
    });
    if (!member || !hasTeamPermission(member, TeamPermission.TEAM_UPDATE_ROLE)) {
      throw new ForbiddenException('팀 관리자만 역할을 삭제할 수 있습니다.');
    }
    const role = await this.teamRolePolicyRepository.findOne({
      where: { id: roleId, team: { id: teamId } },
    });
    if (!role || role.isSystem) {
      throw new NotFoundException('커스텀 역할을 찾을 수 없습니다.');
    }
    await this.teamMemberRepository.update(
      { team: { id: teamId }, customRole: { id: roleId } },
      { customRole: null },
    );
    await this.teamRolePolicyRepository.remove(role);
    return { success: true };
  }

  async assignCustomRole(teamId: string, actor: User, targetUserId: string, roleId: string | null) {
    const actorMember = await this.teamMemberRepository.findOne({
      where: { team: { id: teamId }, user: { id: actor.id } },
      relations: ['customRole'],
    });
    if (!actorMember || !hasTeamPermission(actorMember, TeamPermission.TEAM_UPDATE_ROLE)) {
      throw new ForbiddenException('팀 관리자만 역할을 변경할 수 있습니다.');
    }
    if (actor.id === targetUserId) {
      throw new ForbiddenException('본인의 역할은 변경할 수 없습니다.');
    }
    const targetMember = await this.teamMemberRepository.findOne({
      where: { team: { id: teamId }, user: { id: targetUserId } },
    });
    if (!targetMember) {
      throw new NotFoundException('멤버를 찾을 수 없습니다.');
    }
    if (targetMember.role === TeamRole.OWNER) {
      throw new ForbiddenException('오너 역할은 변경할 수 없습니다.');
    }
    if (!roleId) {
      targetMember.customRole = null;
      await this.teamMemberRepository.save(targetMember);
      return { success: true };
    }
    const role = await this.teamRolePolicyRepository.findOne({
      where: { id: roleId, team: { id: teamId } },
    });
    if (!role || role.isSystem) {
      throw new NotFoundException('커스텀 역할을 찾을 수 없습니다.');
    }
    targetMember.customRole = role;
    await this.teamMemberRepository.save(targetMember);
    return { success: true };
  }

  async inviteMember(teamId: string, inviter: User, email: string, role: TeamRole, message?: string) {
    const member = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: inviter.id },
      },
      relations: ['team', 'team.workspace', 'customRole'],
    });

    if (!member || !hasTeamPermission(member, TeamPermission.TEAM_INVITE_MEMBER)) {
      throw new ForbiddenException('팀 관리자만 초대할 수 있습니다.');
    }

    const invitee = await this.usersRepository.findOne({
      where: { email },
    });
    if (!invitee) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
    if (!invitee.email) {
      throw new NotFoundException('이메일이 등록되지 않은 유저입니다.');
    }
    if (inviter.id === invitee.id) {
      throw new ConflictException('자기 자신을 초대할 수 없습니다.');
    }

    const alreadyMember = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: invitee.id },
      },
    });

    if (alreadyMember) {
      throw new ConflictException('이미 해당 유저가 팀 멤버입니다.');
    }

    const exists = await this.teamInviteRepository.findOne({
      where: {
        team: { id: teamId },
        invitee: { id: invitee.id },
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
        role,
        message,
      }),
    );

    await this.notificationService.create({
      user: invitee,
      type: NotificationType.INVITE,
      payload: {
        teamId,
        teamName: member.team.name,
        workspaceId: member.team.workspace?.id,
        inviterName: inviter.displayName ?? inviter.name,
        inviteId: invite.id,
        role,
        message,
      }
    })

    return invite;
  }

  async getPendingInvites(teamId: string, user: User) {
    const manager = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: user.id },
      },
      relations: ['customRole'],
    });

    if (!manager || !hasTeamPermission(manager, TeamPermission.TEAM_INVITE_MEMBER)) {
      throw new ForbiddenException('팀 관리자만 초대 목록을 볼 수 있습니다.');
    }

    const invites = await this.teamInviteRepository.find({
      where: { team: { id: teamId }, status: TeamInviteStatus.PENDING },
      relations: ['inviter', 'invitee'],
      order: { createdAt: 'DESC' },
    });

    return invites.map((invite) => ({
      id: invite.id,
      email: invite.invitee.email,
      name: invite.invitee.displayName ?? invite.invitee.name,
      role: invite.role,
      invitedByName: invite.inviter.displayName ?? invite.inviter.name,
      invitedAt: invite.createdAt,
      status: invite.status,
      message: invite.message ?? undefined,
    }));
  }

  async updateMemberRole(teamId: string, actor: User, targetUserId: string, role: TeamRole) {
    if (actor.id === targetUserId) {
      throw new ForbiddenException('본인의 역할은 변경할 수 없습니다.');
    }

    const actorMember = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: actor.id },
      },
      relations: ['customRole'],
    });

    if (!actorMember || !hasTeamPermission(actorMember, TeamPermission.TEAM_UPDATE_ROLE)) {
      throw new ForbiddenException('팀 관리자만 역할을 변경할 수 있습니다.');
    }

    const targetMember = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: targetUserId },
      },
      relations: ['user'],
    });

    if (!targetMember) {
      throw new NotFoundException('멤버를 찾을 수 없습니다.');
    }

    if (targetMember.role === TeamRole.OWNER) {
      throw new ForbiddenException('오너 역할은 변경할 수 없습니다.');
    }

    if (role === TeamRole.OWNER) {
      throw new ForbiddenException('오너 역할로 변경할 수 없습니다.');
    }

    if (actorMember.role === TeamRole.MANAGER) {
      if (targetMember.role === TeamRole.MANAGER || role === TeamRole.MANAGER) {
        throw new ForbiddenException('매니저 역할 변경은 오너만 가능합니다.');
      }
    }

    targetMember.role = role;
    targetMember.customRole = null;
    await this.teamMemberRepository.save(targetMember);

    return {
      userId: targetMember.user.id,
      role: targetMember.role,
    };
  }

  async updateMemberNickname(teamId: string, actor: User, targetUserId: string, nickname?: string) {
    const actorMember = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: actor.id },
      },
      relations: ['customRole'],
    });

    if (!actorMember) {
      throw new ForbiddenException('팀 멤버만 닉네임을 변경할 수 있습니다.');
    }

    const isSelf = actor.id === targetUserId;
    if (!isSelf && !hasTeamPermission(actorMember, TeamPermission.TEAM_UPDATE_ROLE)) {
      throw new ForbiddenException('팀 관리자만 닉네임을 변경할 수 있습니다.');
    }

    const targetMember = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: targetUserId },
      },
      relations: ['user'],
    });

    if (!targetMember) {
      throw new NotFoundException('멤버를 찾을 수 없습니다.');
    }

    const trimmed = nickname?.trim() ?? '';
    if (trimmed.length > 32) {
      throw new BadRequestException('닉네임은 최대 32자까지 가능합니다.');
    }
    targetMember.nickname = trimmed.length ? trimmed : null;
    await this.teamMemberRepository.save(targetMember);

    return {
      userId: targetMember.user.id,
      nickname: targetMember.nickname ?? null,
    };
  }

  async updateMemberAvatar(teamId: string, actor: User, targetUserId: string, avatarUrl?: string) {
    const actorMember = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: actor.id },
      },
      relations: ['customRole'],
    });

    if (!actorMember) {
      throw new ForbiddenException('팀 멤버만 아바타를 변경할 수 있습니다.');
    }

    const isSelf = actor.id === targetUserId;
    if (!isSelf && !hasTeamPermission(actorMember, TeamPermission.TEAM_UPDATE_ROLE)) {
      throw new ForbiddenException('팀 관리자만 아바타를 변경할 수 있습니다.');
    }

    const targetMember = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: targetUserId },
      },
      relations: ['user'],
    });

    if (!targetMember) {
      throw new NotFoundException('멤버를 찾을 수 없습니다.');
    }

    const trimmed = avatarUrl?.trim() ?? '';
    targetMember.avatarUrl = trimmed.length ? trimmed : null;
    await this.teamMemberRepository.save(targetMember);

    return {
      userId: targetMember.user.id,
      avatarUrl: targetMember.avatarUrl ?? null,
    };
  }

  async removeMember(teamId: string, actor: User, targetUserId: string) {
    if (actor.id === targetUserId) {
      throw new ForbiddenException('본인은 팀에서 삭제할 수 없습니다.');
    }

    const actorMember = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: actor.id },
      },
      relations: ['team', 'team.workspace', 'customRole'],
    });

    if (!actorMember || !hasTeamPermission(actorMember, TeamPermission.TEAM_INVITE_MEMBER)) {
      throw new ForbiddenException('팀 관리자만 멤버를 삭제할 수 있습니다.');
    }

    const targetMember = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: targetUserId },
      },
      relations: ['user'],
    });

    if (!targetMember) {
      throw new NotFoundException('멤버를 찾을 수 없습니다.');
    }

    if (targetMember.role === TeamRole.OWNER) {
      throw new ForbiddenException('오너는 삭제할 수 없습니다.');
    }

    if (actorMember.role === TeamRole.MANAGER && targetMember.role === TeamRole.MANAGER) {
      throw new ForbiddenException('매니저 삭제는 오너만 가능합니다.');
    }

    await this.teamMemberRepository.remove(targetMember);

    const workspaceId = actorMember.team.workspace?.id;
    if (workspaceId) {
      const remainingTeams = await this.teamMemberRepository.count({
        where: {
          user: { id: targetUserId },
          team: { workspace: { id: workspaceId } },
        },
      });
      if (remainingTeams === 0) {
        const workspaceMember = await this.workspaceMemberRepository.findOne({
          where: {
            workspace: { id: workspaceId },
            user: { id: targetUserId },
          },
        });
        if (workspaceMember && workspaceMember.role !== WorkspaceRole.OWNER) {
          await this.workspaceMemberRepository.remove(workspaceMember);
        }
      }
    }

    return { success: true };
  }

  async acceptInvite(inviteId: string, user: User) {
    const invite = await this.teamInviteRepository.findOne({
      where: {
        id: inviteId,
        invitee: { id: user.id },
        status: TeamInviteStatus.PENDING,
      },
      relations: ['team', 'team.workspace'],
    });

    if (!invite) {
      throw new NotFoundException('초대를 찾을 수 없습니다.');
    }

    invite.status = TeamInviteStatus.ACCEPTED;
    await this.teamInviteRepository.save(invite);

    const member = this.teamMemberRepository.create({
      team: invite.team,
      user,
      role: invite.role ?? TeamRole.MEMBER,
    });

    await this.teamMemberRepository.save(member);

    const workspaceId = invite.team?.workspace?.id;
    if (workspaceId) {
      const exists = await this.workspaceMemberRepository.findOne({
        where: { workspace: { id: workspaceId }, user: { id: user.id } },
      });
      if (!exists) {
        const workspaceRole =
          invite.role === TeamRole.GUEST ? WorkspaceRole.GUEST : WorkspaceRole.MEMBER;
        await this.workspaceMemberRepository.save(
          this.workspaceMemberRepository.create({
            workspace: { id: workspaceId } as Workspace,
            user: { id: user.id } as User,
            role: workspaceRole,
          }),
        );
      }
    }

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

  async updateTeam(teamId: string, updateTeamDto: UpdateTeamDto, actor: User) {
    const member = await this.teamMemberRepository.findOne({
      where: { team: { id: teamId }, user: { id: actor.id } },
      relations: ['customRole'],
    });
    if (!member || !hasTeamPermission(member, TeamPermission.TEAM_SETTINGS_UPDATE)) {
      throw new ForbiddenException('팀 설정을 변경할 권한이 없습니다.');
    }
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    if (updateTeamDto.name !== undefined) team.name = updateTeamDto.name;
    if (updateTeamDto.iconType !== undefined) team.iconType = updateTeamDto.iconType;
    if (updateTeamDto.iconValue !== undefined) team.iconValue = updateTeamDto.iconValue;

    return this.teamRepository.save(team);
  }

  async deleteTeam(teamId: string) {
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    await this.teamRepository.remove(team);
    return { success: true };
  }
}
