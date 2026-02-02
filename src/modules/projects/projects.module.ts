// src/modules/project/project.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectFavorite } from './entities/project-favorite.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectManageGuard } from './guards/project-manage.guard';
import { Issue } from '../issues/entities/issue.entity';
import { Channel } from '../chat/entities/channel.entity';
import { ChannelMember } from '../chat/entities/channel-member.entity';
import { CalendarModule } from '../calendar/calendar.module';
import { DocsModule } from '../docs/docs.module';
import { IssuesModule } from '../issues/issues.module';
import { CalendarCategory } from '../calendar/entities/calendar-category.entity';
import { Calendar } from '../calendar/entities/calendar.entity';
import { CalendarMember } from '../calendar/entities/calendar-member.entity';
import { CalendarFolder } from '../calendar/entities/calendar-folder.entity';
import { CalendarEvent } from '../calendar/entities/calendar-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, ProjectFavorite, TeamMember, Issue, Channel, ChannelMember, CalendarCategory, Calendar, CalendarMember, CalendarFolder, CalendarEvent]),
    CalendarModule,
    DocsModule,
    IssuesModule,
  ],
  providers: [ProjectsService, ProjectAccessGuard, ProjectManageGuard],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
