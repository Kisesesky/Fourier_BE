// src/modules/calendar/calendar.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarEvent } from './entities/calendar-event.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { CalendarCategory } from './entities/calendar-category.entity';
import { Issue } from '../issues/entities/issue.entity';
import { Calendar } from './entities/calendar.entity';
import { CalendarMember } from './entities/calendar-member.entity';
import { CalendarFolder } from './entities/calendar-folder.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarEvent, CalendarCategory, Calendar, CalendarMember, CalendarFolder, ProjectMember, Issue, Project]),
  ],
  providers: [CalendarService],
  controllers: [CalendarController],
  exports: [CalendarService, TypeOrmModule],
})
export class CalendarModule {}
