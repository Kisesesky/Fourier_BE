// src/modules/calendar/calendar.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarEvent } from './entities/calendar-event.entity';
import { ProjectsModule } from '../projects/projects.module';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { CalendarCategory } from './entities/calendar-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarEvent, CalendarCategory, ProjectMember]),
  ],
  providers: [CalendarService],
  controllers: [CalendarController],
  exports: [CalendarService],
})
export class CalendarModule {}