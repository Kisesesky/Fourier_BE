import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { MentionController } from './mention.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mention } from './entities/mention.entity';
import { User } from '../users/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { TeamMember } from '../team/entities/team-member.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { Issue } from '../issues/entities/issue.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mention, User, TeamMember, Issue]),
    NotificationModule,
    ActivityLogModule,
  ],
  controllers: [MentionController],
  providers: [MentionService],
})
export class MentionModule {}
