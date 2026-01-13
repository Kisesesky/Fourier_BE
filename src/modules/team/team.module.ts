// src/modules/team/team.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { TeamInvite } from './entities/team-invite.entity';
import { TeamOwnerGuard } from './guards/team-owner.guard';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, TeamMember, TeamInvite, User, Workspace]),
    NotificationModule,
  ],
  controllers: [TeamController],
  providers: [TeamService, TeamOwnerGuard],
  exports: [TeamService]
})
export class TeamModule {}