// src/modules/calendar/calendar.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEvent } from './entities/calendar-event.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarCategory } from './entities/calendar-category.entity';
import { CreateCalendarCategoryDto } from './dto/create-calendar-category.dto';
import { UpdateCalendarCategoryDto } from './dto/update-calendar-category.dto';
import { mapCategory, mapEventToResponse } from './utils/calendar.mapper';
import { CreateCalendarEventFromIssueDto } from './dto/create-calendar-event-from-issue.dto';
import { Issue } from '../issues/entities/issue.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarEventRepository: Repository<CalendarEvent>,
    @InjectRepository(CalendarCategory)
    private readonly calendarCategoryRepository: Repository<CalendarCategory>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  private async checkProjectMember(
    projectId: string,
    userId: string
  ) {
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

    const category = await this.calendarCategoryRepository.findOne({
      where: { 
        id: createCalendarEventDto.categoryId,
        project: { id: projectId },
        isActive: true,
      }
    });

    if (!category) {
      throw new NotFoundException('카테고리가 없습니다.');
    }

    const event = await this.calendarEventRepository.save({
      title: createCalendarEventDto.title,
      project: { id: projectId },
      category,
      createdBy: user,
      startAt: new Date(createCalendarEventDto.startAt),
      endAt: new Date(createCalendarEventDto.endAt),
      location: createCalendarEventDto.location,
      memo: createCalendarEventDto.memo,
    });

    return mapEventToResponse(event);
  }

  async getProjectEvents(
    projectId: string,
    user: User
  ) {
    await this.checkProjectMember(projectId, user.id);

    const events = await this.calendarEventRepository.find({
      where: { project: { id: projectId } },
      order: { startAt: 'ASC' },
    });

    return events.map(event => mapEventToResponse(event));
  }

  async getDefaultCategory(projectId: string): Promise<CalendarCategory> {
    const category = await this.calendarCategoryRepository.findOne({
      where: { project: { id: projectId }, isDefault: true, isActive: true },
    });

    if (!category) {
      throw new NotFoundException('프로젝트 기본 카테고리가 없습니다.');
    }

    return category;
  }

  async updateEvent(
    eventId: string,
    updateCalendarEventDto: UpdateCalendarEventDto,
    user: User
  ) {
    const event = await this.calendarEventRepository.findOne({
      where: { id: eventId },
      relations: ['project']
    });

    if (!event) {
      throw new NotFoundException('이벤트가 없습니다.');
    }

    await this.checkProjectMember(event.project.id, user.id);

    if (updateCalendarEventDto.categoryId) {
      const category = await this.calendarCategoryRepository.findOne({
        where: {
          id: updateCalendarEventDto.categoryId,
          project: { id: event.project.id },
          isActive: true,
        },
      });
      if (!category) {
        throw new NotFoundException('카테고리가 없습니다.');
      }

      event.category = category;
    }

    if (updateCalendarEventDto.title !== undefined) {
      event.title = updateCalendarEventDto.title;
    }
    if (updateCalendarEventDto.location !== undefined) {
      event.location = updateCalendarEventDto.location;
    }
    if (updateCalendarEventDto.memo !== undefined) {
      event.memo = updateCalendarEventDto.memo;
    }
    if (updateCalendarEventDto.startAt !== undefined) {
      event.startAt = new Date(updateCalendarEventDto.startAt);
    }
    if (updateCalendarEventDto.endAt !== undefined) {
      event.endAt = new Date(updateCalendarEventDto.endAt);
    }

    const saved = await this.calendarEventRepository.save(event)
    return mapEventToResponse(saved)
  }

  async deleteEvent(
    eventId: string,
    user: User
  ) {
    const event = await this.calendarEventRepository.findOne({
      where: { id: eventId },
      relations: ['project']
    });

    if (!event) {
      throw new NotFoundException('이벤트가 없습니다.');
    }

    await this.checkProjectMember(event.project.id, user.id);
    await this.calendarEventRepository.remove(event);

    return { success: true };
  }

  async getCategories(
    projectId: string,
    user: User
  ) {
    await this.checkProjectMember(projectId, user.id);

    const categories = await this.calendarCategoryRepository.find({
      where: { project: { id: projectId }, isActive: true },
      order: { createdAt: 'ASC' },
    });

    return categories.map(mapCategory)
  }

  async createCategory(
    projectId: string,
    createCalendarCategoryDto: CreateCalendarCategoryDto,
    user: User,
  ) {
    await this.checkProjectMember(projectId, user.id);

    return this.calendarCategoryRepository.save({
      name: createCalendarCategoryDto.name,
      color: createCalendarCategoryDto.color,
      project: { id: projectId },
    });
  }

  async updateCategory(
    categoryId: string,
    updateCalendarCategoryDto: UpdateCalendarCategoryDto,
    user: User,
  ) {
    const category = await this.calendarCategoryRepository.findOne({
      where: { id: categoryId },
      relations: ['project'],
    });

    if (!category) {
      throw new NotFoundException('카테고리가 없습니다.');
    }

    await this.checkProjectMember(category.project.id, user.id);

    if (updateCalendarCategoryDto.name !== undefined) {
      category.name = updateCalendarCategoryDto.name;
    }
    if (updateCalendarCategoryDto.color !== undefined) {
      category.color = updateCalendarCategoryDto.color;
    }

    return this.calendarCategoryRepository.save(category);
  }

  async deleteCategory(
    categoryId: string,
    user: User
  ) {
    const category = await this.calendarCategoryRepository.findOne({
      where: { id: categoryId },
      relations: ['project'],
    });

    if (!category) {
      throw new NotFoundException('카테고리가 없습니다.');
    }

    if (category.isDefault) {
      throw new ForbiddenException('기본 카테고리는 삭제할 수 없습니다.');
    }

    await this.checkProjectMember(category.project.id, user.id);

    category.isActive = false;
    return this.calendarCategoryRepository.save(category);
  }

  async createEventFromIssue(issue: Issue) {
    const category = await this.getDefaultCategory(issue.project.id); // 프로젝트 기본 이슈 카테고리
    return this.calendarEventRepository.save({
      title: issue.title,
      project: { id: issue.project.id },
      category,
      startAt: issue.startAt,
      endAt: issue.endAt,
      linkedIssueId: issue.id,
      sourceType: 'issue',
    });
  }

  async updateEventFromIssue(issue: Issue) {
    if (!issue.calendarEventId) return null;
    return this.calendarEventRepository.update(issue.calendarEventId, {
      title: issue.title,
      startAt: issue.startAt,
      endAt: issue.endAt,
    });
  }

  async deleteEventByIssue(issue: Issue) {
    if (!issue.calendarEventId) return null;
    await this.calendarEventRepository.delete(issue.calendarEventId);
    issue.calendarEventId = null;
  }
}