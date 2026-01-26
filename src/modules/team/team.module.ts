// src/modules/team/team.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { TeamInvite } from './entities/team-invite.entity';
import { TeamOwnerGuard } from './guards/team-owner.guard';
import { TeamManageGuard } from './guards/team-manage.guard';
import { TeamRolePolicy } from './entities/team-role-policy.entity';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { WorkspaceMember } from '../workspace/entities/workspace-member.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, TeamMember, TeamInvite, TeamRolePolicy, User, Workspace, WorkspaceMember]),
    NotificationModule,
  ],
  controllers: [TeamController],
  providers: [TeamService, TeamOwnerGuard, TeamManageGuard],
  exports: [TeamService]
})
export class TeamModule {}
