import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { Project } from '../projects/entities/project.entity';
import { Issue } from './entities/issue.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueComment } from './entities/issue-comment.entity';
import { User } from '../users/entities/user.entity';
import { IssuesGateway } from './gateways/issues.gateway';
import { CalendarModule } from '../calendar/calendar.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { AppConfigModule } from 'src/config/app/config.module';
import { IssueGroup } from './entities/issue-group.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Project, Issue, IssueComment, IssueGroup, User]),
    CalendarModule,
    ActivityLogModule,
    AppConfigModule,
  ],
  controllers: [IssuesController],
  providers: [IssuesService, IssuesGateway],
  exports: [IssuesService]
})
export class IssuesModule {}
