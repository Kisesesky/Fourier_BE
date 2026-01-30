// src/modules/calendar/calendar.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
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
      sourceType: 'manual',
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

  async getEventAnalytics(
    projectId: string,
    user: User,
    opts: { granularity: 'hourly' | 'daily' | 'monthly'; date?: string; month?: string; year?: string },
  ) {
    await this.checkProjectMember(projectId, user.id);
    const { granularity, date, month, year } = opts;
    let start: Date;
    let end: Date;
    let counts: number[] = [];

    if (granularity === 'hourly') {
      if (!date) throw new BadRequestException('date is required for hourly');
      const parsed = new Date(`${date}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) throw new BadRequestException('invalid date format');
      start = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      end = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + 1);
      counts = Array.from({ length: 24 }, () => 0);
    } else if (granularity === 'daily') {
      if (!month) throw new BadRequestException('month is required for daily');
      const [y, m] = month.split('-').map((v) => Number(v));
      if (!y || !m) throw new BadRequestException('invalid month format');
      start = new Date(y, m - 1, 1);
      end = new Date(y, m, 1);
      const daysInMonth = new Date(y, m, 0).getDate();
      counts = Array.from({ length: daysInMonth }, () => 0);
    } else {
      if (!year) throw new BadRequestException('year is required for monthly');
      const y = Number(year);
      if (!y) throw new BadRequestException('invalid year format');
      start = new Date(y, 0, 1);
      end = new Date(y + 1, 0, 1);
      counts = Array.from({ length: 12 }, () => 0);
    }

    const rows = await this.calendarEventRepository
      .createQueryBuilder('event')
      .where('event.projectId = :projectId', { projectId })
      .andWhere('event.createdAt >= :start', { start })
      .andWhere('event.createdAt < :end', { end })
      .select(['event.createdAt'])
      .getMany();

    rows.forEach((row) => {
      const dt = new Date(row.createdAt);
      if (granularity === 'hourly') counts[dt.getHours()] += 1;
      else if (granularity === 'daily') counts[dt.getDate() - 1] += 1;
      else counts[dt.getMonth()] += 1;
    });

    return { granularity, counts };
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

    if (event.sourceType === 'issue') {
      throw new ForbiddenException('이슈 일정은 캘린더에서 직접 수정할 수 없습니다.');
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

    if (event.sourceType === 'issue') {
      throw new ForbiddenException('이슈 일정은 캘린더에서 직접 삭제할 수 없습니다.');
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

    let categories = await this.calendarCategoryRepository.find({
      where: { project: { id: projectId }, isActive: true },
      order: { createdAt: 'ASC' },
    });

    if (categories.length === 0) {
      const defaults = [
        { name: '기본 캘린더', color: '#3788d8', isDefault: true },
      ];
      categories = await this.calendarCategoryRepository.save(
        defaults.map((c) => ({
          ...c,
          project: { id: projectId },
        })),
      );
    }

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

  async createEventFromIssue(
    issue: Issue
  ) {
    const category = await this.getDefaultCategory(issue.project.id);

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
    if (!issue.calendarEventId) return;

    await this.calendarEventRepository.update(issue.calendarEventId, {
      title: issue.title,
      startAt: issue.startAt,
      endAt: issue.endAt,
    });
  }

  async deleteEventByIssue(
    issue: Issue
  ) {
    if (!issue.calendarEventId) return;

    await this.calendarEventRepository.delete(issue.calendarEventId);
  }

  async updateIssueDatesFromCalendar(
    eventId: string,
    startAt: string,
    endAt: string,
  ) {
    const event = await this.calendarEventRepository.findOne({
      where: { id: eventId },
    });

    if (!event || event.sourceType !== 'issue') {
      throw new ForbiddenException('이슈 일정만 이동할 수 있습니다.');
    }

    const issue = await this.issueRepository.findOne({
      where: { id: event.linkedIssueId },
    });

    if (!issue) {
      throw new NotFoundException('연결된 이슈가 없습니다.');
    }

    issue.startAt = new Date(startAt);
    issue.endAt = new Date(endAt);

    const saved = await this.issueRepository.save(issue);

    await this.updateEventFromIssue(saved);

    return { success: true };
  }
}
