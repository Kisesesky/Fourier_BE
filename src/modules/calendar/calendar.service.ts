// src/modules/calendar/calendar.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEvent } from './entities/calendar-event.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarEventRepository: Repository<CalendarEvent>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  private async checkProjectMember(projectId: string, userId: string) {
    const member = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!member) {
      throw new ForbiddenException('프로젝트 멤버가 아닙니다.');
    }
    return member;
  }

  async createEvent(
    projectId: string,
    createCalendarEventDto: CreateCalendarEventDto,
    user: User
  ) {
    await this.checkProjectMember(projectId, user.id);

    return this.calendarEventRepository.save({
      project: { id: projectId },
      createBy: user,
      ...createCalendarEventDto,
    });
  }

  async getProjectEvents(projectId: string, user: User) {
    await this.checkProjectMember(projectId, user.id);

    return this.calendarEventRepository.find({
      where: { project: { id: projectId } },
      order: { startAt: 'ASC' },
    });
  }

  async updateEvent(eventId: string, updateCalendarEventDto: UpdateCalendarEventDto, user: User) {
    const event = await this.calendarEventRepository.findOne({
      where: { id: eventId },
      relations: ['project']
    });
    if (!event) {
      throw new NotFoundException('이벤트 없음');
    }

    await this.checkProjectMember(event.project.id, user.id);

    Object.assign(event, updateCalendarEventDto);
    return this.calendarEventRepository.save(event);
  }

  async deleteEvent(eventId: string, user: User) {
    const event = await this.calendarEventRepository.findOne({
      where: { id: eventId },
      relations: ['project']
    });
    if (!event) {
      throw new NotFoundException('이벤트 없음');
    }

    await this.checkProjectMember(event.project.id, user.id);

    return this.calendarEventRepository.remove(event);
  }
}