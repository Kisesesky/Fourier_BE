// src/modules/team/team.controller.ts
import { Controller, Post, Get, Param, Body, UseGuards, Patch, Delete } from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamOwnerGuard } from './guards/team-owner.guard';
import { TeamManageGuard } from './guards/team-manage.guard';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InviteTeamMemberDto } from './dto/Invite-team-member.dto';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';
import { CreateTeamRoleDto } from './dto/create-team-role.dto';
import { UpdateTeamRoleDto } from './dto/update-team-role.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@ApiTags('team')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('workspace/:workspaceId/team')
export class TeamController {
  constructor(
    private readonly teamService: TeamService
  ) {}

  @ApiOperation({ summary: '팀 생성'})
  @ApiOkResponse({ type: TeamResponseDto })
  @Post()
  createTeam(
    @Param('workspaceId') workspaceId: string,
    @RequestUser() user: User,
    @Body() createTeamDto: CreateTeamDto,
  ) {
    return this.teamService.createTeam(workspaceId, createTeamDto, user);
  }

  @ApiOperation({ summary: '내 팀 목록'})
  @ApiOkResponse({ type: [TeamResponseDto] })
  @Get()
  getTeams(
    @Param('workspaceId') workspaceId: string,
    @RequestUser() user: User,
  ) {
    return this.teamService.getTeams(workspaceId, user);
  }

  @ApiOperation({ summary: '팀 멤버 목록' })
  @ApiOkResponse({ type: [User] })
  @Get(':teamId/members')
  async getTeamMembers(
    @Param('workspaceId') workspaceId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.teamService.getTeamMembers(teamId);
  }

  @ApiOperation({ summary: '팀 초대 목록' })
  @ApiOkResponse({
    schema: {
      example: [
        {
          id: 'invite-uuid',
          email: 'user@example.com',
          name: 'User',
          role: 'MEMBER',
          invitedByName: 'Owner',
          invitedAt: '2026-01-23T09:00:00.000Z',
          status: 'PENDING',
        },
      ],
    },
  })
  @Get(':teamId/invites')
  @UseGuards(TeamManageGuard)
  async getPendingInvites(
    @Param('teamId') teamId: string,
    @RequestUser() user: User,
  ) {
    return this.teamService.getPendingInvites(teamId, user);
  }

  @ApiOperation({ summary: '팀 초대'})
  @ApiOkResponse({
    schema: {
      example: { id: 'invite-uuid', status: 'PENDING' },
    },
  })
  @Post(':teamId/invite')
  @UseGuards(TeamManageGuard)
  invite(
    @Param('teamId') teamId: string,
    @Body() inviteTeamMemberDto: InviteTeamMemberDto,
    @RequestUser() user: User,
  ) {
    return this.teamService.inviteMember(
      teamId,
      user,
      inviteTeamMemberDto.email,
      inviteTeamMemberDto.role,
      inviteTeamMemberDto.message,
    );
  }

  @ApiOperation({ summary: '팀 초대 수락'})
  @ApiOkResponse({
    schema: {
      example: { success: true },
    },
  })
  @Post('invite/:inviteId/accept')
  accept(
    @Param('inviteId') inviteId: string,
    @RequestUser() user: User,
  ) {
    return this.teamService.acceptInvite(inviteId, user);
  }

  @ApiOperation({ summary: '팀 초대 거절'})
  @ApiOkResponse({
    schema: {
      example: { success: true },
    },
  })
  @Post('invite/:inviteId/reject')
  reject(
    @Param('inviteId') inviteId: string,
    @RequestUser() user: User,
  ) {
    return this.teamService.rejectInvite(inviteId, user);
  }

  @ApiOperation({ summary: '팀 정보 수정' })
  @ApiOkResponse({ type: TeamResponseDto })
  @Patch(':teamId')
  @UseGuards(TeamManageGuard)
  updateTeam(
    @Param('workspaceId') workspaceId: string,
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @RequestUser() user: User,
  ) {
    return this.teamService.updateTeam(teamId, updateTeamDto, user);
  }

  @ApiOperation({ summary: '팀 멤버 역할 변경' })
  @ApiOkResponse({
    schema: {
      example: { userId: 'user-uuid', role: 'MANAGER' },
    },
  })
  @Patch(':teamId/members/:memberId/role')
  @UseGuards(TeamManageGuard)
  updateMemberRole(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() updateTeamMemberRoleDto: UpdateTeamMemberRoleDto,
    @RequestUser() user: User,
  ) {
    return this.teamService.updateMemberRole(teamId, user, memberId, updateTeamMemberRoleDto.role);
  }

  @ApiOperation({ summary: '팀 멤버 커스텀 역할 지정' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  @Patch(':teamId/members/:memberId/custom-role')
  @UseGuards(TeamManageGuard)
  updateMemberCustomRole(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() body: { roleId?: string | null },
    @RequestUser() user: User,
  ) {
    return this.teamService.assignCustomRole(teamId, user, memberId, body?.roleId ?? null);
  }

  @ApiOperation({ summary: '팀 멤버 삭제' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  @Delete(':teamId/members/:memberId')
  @UseGuards(TeamManageGuard)
  removeMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @RequestUser() user: User,
  ) {
    return this.teamService.removeMember(teamId, user, memberId);
  }

  @ApiOperation({ summary: '팀 커스텀 역할 목록' })
  @ApiOkResponse({ schema: { example: [{ id: 'role-uuid', name: 'Custom Editor', permissions: ['TEAM_INVITE_MEMBER'] }] } })
  @Get(':teamId/roles')
  @UseGuards(TeamManageGuard)
  getCustomRoles(
    @Param('teamId') teamId: string,
  ) {
    return this.teamService.getCustomRoles(teamId);
  }

  @ApiOperation({ summary: '팀 커스텀 역할 생성' })
  @ApiOkResponse({ schema: { example: { id: 'role-uuid', name: 'Custom Editor', permissions: ['TEAM_INVITE_MEMBER'] } } })
  @Post(':teamId/roles')
  @UseGuards(TeamManageGuard)
  createCustomRole(
    @Param('teamId') teamId: string,
    @Body() createTeamRoleDto: CreateTeamRoleDto,
    @RequestUser() user: User,
  ) {
    return this.teamService.createCustomRole(
      teamId,
      user,
      createTeamRoleDto.name,
      createTeamRoleDto.description,
      createTeamRoleDto.permissions,
    );
  }

  @ApiOperation({ summary: '팀 커스텀 역할 수정' })
  @ApiOkResponse({ schema: { example: { id: 'role-uuid', name: 'Custom Editor', permissions: ['TEAM_INVITE_MEMBER'] } } })
  @Patch(':teamId/roles/:roleId')
  @UseGuards(TeamManageGuard)
  updateCustomRole(
    @Param('teamId') teamId: string,
    @Param('roleId') roleId: string,
    @Body() updateTeamRoleDto: UpdateTeamRoleDto,
    @RequestUser() user: User,
  ) {
    return this.teamService.updateCustomRole(
      teamId,
      roleId,
      user,
      updateTeamRoleDto.name,
      updateTeamRoleDto.description,
      updateTeamRoleDto.permissions,
    );
  }

  @ApiOperation({ summary: '팀 커스텀 역할 삭제' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  @Delete(':teamId/roles/:roleId')
  @UseGuards(TeamManageGuard)
  deleteCustomRole(
    @Param('teamId') teamId: string,
    @Param('roleId') roleId: string,
    @RequestUser() user: User,
  ) {
    return this.teamService.deleteCustomRole(teamId, roleId, user);
  }

  @ApiOperation({ summary: '팀 삭제' })
  @ApiOkResponse({
    schema: {
      example: { success: true },
    },
  })
  @Delete(':teamId')
  @UseGuards(TeamOwnerGuard)
  deleteTeam(
    @Param('workspaceId') workspaceId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.teamService.deleteTeam(teamId);
  }
}
