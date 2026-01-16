// src/modules/project/project.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectMember } from './entities/project-member.entity';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, TeamMember, Issue, Channel, ChannelMember, CalendarCategory]),
    CalendarModule,
    DocsModule,
    IssuesModule,
  ],
  providers: [ProjectsService, ProjectAccessGuard, ProjectManageGuard],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}