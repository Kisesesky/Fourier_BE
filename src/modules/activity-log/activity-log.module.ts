// src/modules/activity-log/activity-log.module.ts
import { Module } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { User } from '../users/entities/user.entity';
import { ProjectActivityController } from './controllers/project-activity.controller';
import { TeamActivityController } from './controllers/team-activity.controller';
import { TeamMember } from '../team/entities/team-member.entity';
import { ActivityGateway } from './gateways/activity.gateway';
import { AppConfigModule } from 'src/config/app/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog, ProjectMember, TeamMember ,User]),
    AppConfigModule,
  ],
  controllers: [ProjectActivityController, TeamActivityController,],
  providers: [ActivityLogService, ActivityGateway],
  exports: [ActivityLogService, ActivityGateway, TypeOrmModule],
})
export class ActivityLogModule {}