// src/modules/team/team.controller.ts
import { Controller, Post, Get, Param, Body, UseGuards, Patch, Delete } from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamOwnerGuard } from './guards/team-owner.guard';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InviteTeamMemberDto } from './dto/Invite-team-member.dto';
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

  @ApiOperation({ summary: '팀 초대'})
  @ApiOkResponse({
    schema: {
      example: { id: 'invite-uuid', status: 'PENDING' },
    },
  })
  @Post(':teamId/invite')
  @UseGuards(TeamOwnerGuard)
  invite(
    @Param('teamId') teamId: string,
    @Body() inviteTeamMemberDto: InviteTeamMemberDto,
    @RequestUser() user: User,
  ) {
    return this.teamService.inviteMember(teamId, user, inviteTeamMemberDto.userId);
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
  @UseGuards(TeamOwnerGuard)
  updateTeam(
    @Param('workspaceId') workspaceId: string,
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamService.updateTeam(teamId, updateTeamDto);
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
