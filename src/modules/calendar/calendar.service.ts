// src/modules/calendar/calendar.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
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
import { Calendar } from './entities/calendar.entity';
import { CalendarMember } from './entities/calendar-member.entity';
import { CalendarFolder } from './entities/calendar-folder.entity';
import { CalendarType } from './constants/calendar-type.enum';
import { CalendarMemberRole } from './constants/calendar-member-role.enum';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { CreateCalendarFolderDto } from './dto/create-calendar-folder.dto';
import { UpdateCalendarFolderDto } from './dto/update-calendar-folder.dto';
import { mapFolder } from './utils/calendar.mapper';
import { ProjectRole } from '../projects/constants/project-role.enum';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarEventRepository: Repository<CalendarEvent>,
    @InjectRepository(CalendarCategory)
    private readonly calendarCategoryRepository: Repository<CalendarCategory>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarMember)
    private readonly calendarMemberRepository: Repository<CalendarMember>,
    @InjectRepository(CalendarFolder)
    private readonly calendarFolderRepository: Repository<CalendarFolder>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
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

  private async requireProjectManager(projectId: string, userId: string) {
    const member = await this.checkProjectMember(projectId, userId);
    if (member.role !== ProjectRole.OWNER && member.role !== ProjectRole.MANAGER) {
      throw new ForbiddenException('프로젝트 매니저 이상만 가능합니다.');
    }
    return member;
  }

  private async getOrCreateDefaultFolder(projectId: string, user: User) {
    const existing = await this.calendarFolderRepository.findOne({
      where: { project: { id: projectId }, isActive: true },
      order: { createdAt: 'ASC' },
    });
    if (existing) return existing;
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    const folderName = project?.name ?? '프로젝트';
    const created = await this.calendarFolderRepository.save(
      this.calendarFolderRepository.create({
        project: { id: projectId } as any,
        name: folderName,
        createdBy: user,
      }),
    );
    return created;
  }

  private async canManageFolder(folderId: string, user: User) {
    const folder = await this.calendarFolderRepository.findOne({
      where: { id: folderId, isActive: true },
      relations: ['project', 'createdBy'],
    });
    if (!folder) throw new NotFoundException('캘린더 폴더를 찾을 수 없습니다.');
    await this.checkProjectMember(folder.project.id, user.id);
    if (folder.createdBy?.id === user.id) return folder;
    await this.requireProjectManager(folder.project.id, user.id);
    return folder;
  }

  private async ensureDefaultCalendar(projectId: string, user: User) {
    const existing = await this.calendarRepository.find({
      where: { project: { id: projectId }, isActive: true },
    });
    if (existing.length > 0) {
      const primary = existing[0];
      await this.calendarCategoryRepository.update(
        { project: { id: projectId }, calendar: null },
        { calendar: primary },
      );
      await this.calendarEventRepository.update(
        { project: { id: projectId }, calendar: null },
        { calendar: primary },
      );
      return existing;
    }
    const defaultFolder = await this.getOrCreateDefaultFolder(projectId, user);
    const created = await this.calendarRepository.save(
      this.calendarRepository.create({
        project: { id: projectId },
        name: '프로젝트 캘린더',
        type: CalendarType.TEAM,
        owner: user,
        color: '#3b82f6',
        folder: defaultFolder,
      }),
    );
    await this.calendarMemberRepository.save(
      this.calendarMemberRepository.create({
        calendar: created,
        user,
        role: CalendarMemberRole.OWNER,
      }),
    );
    await this.calendarCategoryRepository.update(
      { project: { id: projectId }, calendar: null },
      { calendar: created },
    );
    await this.calendarEventRepository.update(
      { project: { id: projectId }, calendar: null },
      { calendar: created },
    );
    return [created];
  }

  async ensurePersonalCalendar(projectId: string, user: User) {
    const existing = await this.calendarRepository.findOne({
      where: { project: { id: projectId }, type: CalendarType.PERSONAL, owner: { id: user.id }, isActive: true },
      relations: ['owner'],
    });
    if (existing) return this.mapCalendar(existing);

    const name = `${user.displayName ?? user.name ?? user.email ?? '개인'} 캘린더`;
    const calendar = await this.calendarRepository.save(
      this.calendarRepository.create({
        project: { id: projectId },
        name,
        type: CalendarType.PERSONAL,
        owner: user,
        color: '#64748b',
        isActive: true,
        folder: null,
      }),
    );

    await this.calendarMemberRepository.save(
      this.calendarMemberRepository.create({
        calendar,
        user,
        role: CalendarMemberRole.OWNER,
      }),
    );

    await this.calendarCategoryRepository.save(
      this.calendarCategoryRepository.create({
        name: '기본',
        color: calendar.color,
        project: { id: projectId },
        calendar,
        isDefault: true,
      }),
    );

    return this.mapCalendar(calendar);
  }

  private async checkCalendarAccess(calendarId: string, user: User) {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId, isActive: true },
      relations: ['project', 'owner'],
    });
    if (!calendar) {
      throw new NotFoundException('캘린더가 없습니다.');
    }
    await this.checkProjectMember(calendar.project.id, user.id);
    if (calendar.type === CalendarType.TEAM) {
      return calendar;
    }
    if (calendar.owner?.id === user.id) {
      return calendar;
    }
    const member = await this.calendarMemberRepository.findOne({
      where: { calendar: { id: calendarId }, user: { id: user.id } },
    });
    if (!member) {
      throw new ForbiddenException('캘린더 접근 권한이 없습니다.');
    }
    return calendar;
  }

  private async canManageCalendar(calendarId: string, user: User) {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId, isActive: true },
      relations: ['project', 'owner'],
    });
    if (!calendar) {
      throw new NotFoundException('캘린더가 없습니다.');
    }
    const projectMember = await this.checkProjectMember(calendar.project.id, user.id);
    if (calendar.owner?.id === user.id) return calendar;
    if (projectMember.role === ProjectRole.OWNER || projectMember.role === ProjectRole.MANAGER) {
      return calendar;
    }
    throw new ForbiddenException('캘린더 관리 권한이 없습니다.');
  }

  private async validateMemberIds(projectId: string, memberIds: string[]) {
    if (memberIds.length === 0) return [];
    const members = await this.projectMemberRepository.find({
      where: { project: { id: projectId }, user: { id: In(memberIds) } },
      relations: ['user'],
    });
    const validIds = new Set(members.map((m) => m.user.id));
    const invalid = memberIds.filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
      throw new BadRequestException('프로젝트 멤버만 추가할 수 있습니다.');
    }
    return members.map((m) => m.user);
  }

  private mapCalendar(calendar: Calendar) {
    return {
      id: calendar.id,
      name: calendar.name,
      type: calendar.type,
      color: calendar.color,
      ownerId: calendar.owner?.id ?? null,
      folderId: calendar.folder?.id ?? null,
    };
  }

  async getCalendars(projectId: string, user: User) {
    await this.checkProjectMember(projectId, user.id);
    await this.ensurePersonalCalendar(projectId, user);
    await this.ensureDefaultCalendar(projectId, user);

    const calendars = await this.calendarRepository.find({
      where: { project: { id: projectId }, isActive: true },
      relations: ['owner', 'folder'],
      order: { createdAt: 'ASC' },
    });

    if (calendars.length === 0) return [];

    const privateIds = calendars
      .filter((calendar) => calendar.type === CalendarType.PRIVATE)
      .map((calendar) => calendar.id);
    const memberMap = new Set<string>();
    if (privateIds.length > 0) {
      const memberships = await this.calendarMemberRepository.find({
        where: { calendar: { id: In(privateIds) }, user: { id: user.id } },
        relations: ['calendar'],
      });
      memberships.forEach((membership) => memberMap.add(membership.calendar.id));
    }

    return calendars
      .filter((calendar) => {
        if (calendar.type === CalendarType.TEAM) return true;
        if (calendar.type === CalendarType.PERSONAL) return calendar.owner?.id === user.id;
        return memberMap.has(calendar.id);
      })
      .map((calendar) => this.mapCalendar(calendar));
  }

  async getProjectCategories(projectId: string, user: User) {
    await this.checkProjectMember(projectId, user.id);
    const calendars = await this.calendarRepository.find({
      where: {
        project: { id: projectId },
        isActive: true,
        type: Not(CalendarType.PERSONAL),
      },
      select: ['id'],
    });
    const calendarIds = calendars.map((calendar) => calendar.id);
    if (calendarIds.length === 0) return [];
    const categories = await this.calendarCategoryRepository.find({
      where: {
        project: { id: projectId },
        isActive: true,
        calendar: { id: In(calendarIds) },
      },
      relations: ['calendar'],
      order: { createdAt: 'ASC' },
    });
    return categories.map((category) => mapCategory(category));
  }

  async getFolders(projectId: string, user: User) {
    await this.checkProjectMember(projectId, user.id);
    const folders = await this.calendarFolderRepository.find({
      where: { project: { id: projectId }, isActive: true },
      relations: ['createdBy'],
      order: { createdAt: 'ASC' },
    });
    return folders.map((folder) => mapFolder(folder));
  }

  async createFolder(projectId: string, dto: CreateCalendarFolderDto, user: User) {
    await this.checkProjectMember(projectId, user.id);
    const folder = await this.calendarFolderRepository.save(
      this.calendarFolderRepository.create({
        project: { id: projectId } as any,
        name: dto.name,
        createdBy: user,
        isActive: true,
      }),
    );
    return mapFolder(folder);
  }

  async updateFolder(folderId: string, dto: UpdateCalendarFolderDto, user: User) {
    const folder = await this.canManageFolder(folderId, user);
    if (dto.name !== undefined) folder.name = dto.name;
    const saved = await this.calendarFolderRepository.save(folder);
    return mapFolder(saved);
  }

  async deleteFolder(folderId: string, user: User) {
    const folder = await this.canManageFolder(folderId, user);
    const defaultFolder = await this.calendarFolderRepository.findOne({
      where: { project: { id: folder.project.id }, isActive: true },
      order: { createdAt: 'ASC' },
    });
    if (defaultFolder && defaultFolder.id === folder.id) {
      throw new ForbiddenException('기본 캘린더 폴더는 삭제할 수 없습니다.');
    }
    folder.isActive = false;
    await this.calendarFolderRepository.save(folder);
    return { success: true };
  }

  async createCalendar(projectId: string, dto: CreateCalendarDto, user: User) {
    await this.checkProjectMember(projectId, user.id);

    if (dto.type === CalendarType.TEAM || dto.type === CalendarType.PRIVATE) {
      await this.requireProjectManager(projectId, user.id);
    }

    if (dto.type === CalendarType.PERSONAL) {
      throw new BadRequestException('개인 캘린더는 자동으로 생성됩니다.');
    }

    if (dto.type === CalendarType.TEAM) {
      const count = await this.calendarRepository.count({
        where: { project: { id: projectId }, type: CalendarType.TEAM, isActive: true },
      });
      if (count >= 5) throw new BadRequestException('팀 캘린더는 최대 5개까지 생성할 수 있습니다.');
    }

    let folder: CalendarFolder | null = null;
    if (dto.folderId) {
      folder = await this.calendarFolderRepository.findOne({
        where: { id: dto.folderId, project: { id: projectId }, isActive: true },
      });
      if (!folder) throw new NotFoundException('캘린더 폴더를 찾을 수 없습니다.');
    } else {
      folder = await this.getOrCreateDefaultFolder(projectId, user);
    }

    const calendar = await this.calendarRepository.save(
      this.calendarRepository.create({
        project: { id: projectId },
        name: dto.name,
        type: dto.type,
        owner: user,
        color: dto.color ?? '#3b82f6',
        isActive: true,
        folder,
      }),
    );

    await this.calendarMemberRepository.save(
      this.calendarMemberRepository.create({
        calendar,
        user,
        role: CalendarMemberRole.OWNER,
      }),
    );

    const memberIds = dto.memberIds ?? [];
    if (dto.type === CalendarType.PRIVATE && memberIds.length > 0) {
      const members = await this.validateMemberIds(projectId, memberIds);
      const extraMembers = members.filter((member) => member.id !== user.id);
      if (extraMembers.length > 0) {
        await this.calendarMemberRepository.save(
          extraMembers.map((member) =>
            this.calendarMemberRepository.create({
              calendar,
              user: member,
              role: CalendarMemberRole.MEMBER,
            }),
          ),
        );
      }
    }

    const defaultCategory = await this.calendarCategoryRepository.save(
      this.calendarCategoryRepository.create({
        name: '기본',
        color: calendar.color,
        project: { id: projectId },
        calendar,
        isDefault: true,
      }),
    );

    return this.mapCalendar(calendar);
  }

  async updateCalendar(calendarId: string, dto: UpdateCalendarDto, user: User) {
    const calendar = await this.canManageCalendar(calendarId, user);
    if (dto.name !== undefined) calendar.name = dto.name;
    if (dto.color !== undefined) calendar.color = dto.color;
    if (dto.folderId !== undefined) {
      if (dto.folderId === null) {
        calendar.folder = null;
      } else {
        const folder = await this.calendarFolderRepository.findOne({
          where: { id: dto.folderId, project: { id: calendar.project.id }, isActive: true },
        });
        if (!folder) throw new NotFoundException('캘린더 폴더를 찾을 수 없습니다.');
        calendar.folder = folder;
      }
    }
    if (dto.type !== undefined && dto.type !== calendar.type) {
      if (dto.type === CalendarType.PERSONAL) {
        throw new BadRequestException('개인 캘린더로 변경할 수 없습니다.');
      }
      if (dto.type === CalendarType.TEAM || dto.type === CalendarType.PRIVATE) {
        await this.requireProjectManager(calendar.project.id, user.id);
      }
      calendar.type = dto.type;
    }
    const saved = await this.calendarRepository.save(calendar);

    if (dto.memberIds && saved.type === CalendarType.PRIVATE) {
      const members = await this.validateMemberIds(calendar.project.id, dto.memberIds);
      const memberIds = new Set(members.map((member) => member.id));
      const existing = await this.calendarMemberRepository.find({
        where: { calendar: { id: saved.id } },
        relations: ['user'],
      });
      const keepIds = new Set([user.id, ...memberIds]);
      const toRemove = existing.filter((item) => !keepIds.has(item.user.id));
      if (toRemove.length > 0) {
        await this.calendarMemberRepository.remove(toRemove);
      }
      const existingIds = new Set(existing.map((item) => item.user.id));
      const toAdd = members.filter((member) => !existingIds.has(member.id) && member.id !== user.id);
      if (toAdd.length > 0) {
        await this.calendarMemberRepository.save(
          toAdd.map((member) =>
            this.calendarMemberRepository.create({
              calendar: saved,
              user: member,
              role: CalendarMemberRole.MEMBER,
            }),
          ),
        );
      }
    }

    return this.mapCalendar(saved);
  }

  async getCalendarMembers(calendarId: string, user: User) {
    const calendar = await this.checkCalendarAccess(calendarId, user);
    const members = await this.calendarMemberRepository.find({
      where: { calendar: { id: calendar.id } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
    return members.map((member) => ({
      userId: member.user.id,
      name: member.user.name,
      avatarUrl: member.user.avatarUrl ?? null,
      role: member.role,
    }));
  }

  async deleteCalendar(calendarId: string, user: User) {
    const calendar = await this.canManageCalendar(calendarId, user);
    if (calendar.type === CalendarType.PERSONAL) {
      throw new ForbiddenException('개인 캘린더는 삭제할 수 없습니다.');
    }
    calendar.isActive = false;
    await this.calendarRepository.save(calendar);
    return { success: true };
  }

  async createEvent(
    projectId: string,
    createCalendarEventDto: CreateCalendarEventDto,
    user: User
  ) {
    await this.checkProjectMember(projectId, user.id);

    if (!createCalendarEventDto.calendarId) {
      throw new BadRequestException('calendarId is required');
    }

    const calendar = await this.checkCalendarAccess(createCalendarEventDto.calendarId, user);

    const category = await this.calendarCategoryRepository.findOne({
      where: {
        id: createCalendarEventDto.categoryId,
        calendar: { id: calendar.id },
        isActive: true,
      },
      relations: ['calendar'],
    });

    if (!category) {
      throw new NotFoundException('카테고리가 없습니다.');
    }

    const event = await this.calendarEventRepository.save({
      title: createCalendarEventDto.title,
      project: { id: projectId },
      calendar: { id: calendar.id },
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
    user: User,
    calendarId?: string,
  ) {
    await this.checkProjectMember(projectId, user.id);

    if (calendarId) {
      await this.checkCalendarAccess(calendarId, user);
      const events = await this.calendarEventRepository.find({
        where: { project: { id: projectId }, calendar: { id: calendarId } },
        order: { startAt: 'ASC' },
        relations: ['createdBy', 'category', 'category.calendar', 'calendar'],
      });
      return events.map(event => mapEventToResponse(event));
    }

    const accessible = await this.getCalendars(projectId, user);
    const calendarIds = accessible.map((calendar) => calendar.id);
    if (calendarIds.length === 0) return [];
    const events = await this.calendarEventRepository.find({
      where: { project: { id: projectId }, calendar: { id: In(calendarIds) } },
      order: { startAt: 'ASC' },
      relations: ['createdBy', 'category', 'category.calendar', 'calendar'],
    });
    return events.map(event => mapEventToResponse(event));
  }

  async getEventAnalytics(
    projectId: string,
    user: User,
    opts: { granularity: 'hourly' | 'daily' | 'monthly'; date?: string; month?: string; year?: string },
  ) {
    await this.checkProjectMember(projectId, user.id);
    const calendars = await this.getCalendars(projectId, user);
    const calendarIds = calendars.map((calendar) => calendar.id);
    if (calendarIds.length === 0) {
      return { granularity: opts.granularity, counts: [] };
    }
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
      .andWhere('event.calendarId IN (:...calendarIds)', { calendarIds })
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
    const calendar = await this.calendarRepository.findOne({
      where: { project: { id: projectId }, type: CalendarType.TEAM, isActive: true },
      order: { createdAt: 'ASC' },
    });
    if (!calendar) {
      throw new NotFoundException('프로젝트 기본 캘린더가 없습니다.');
    }
    const category = await this.calendarCategoryRepository.findOne({
      where: { calendar: { id: calendar.id }, isDefault: true, isActive: true },
      relations: ['calendar'],
    });

    if (!category) {
      throw new NotFoundException('프로젝트 기본 카테고리가 없습니다.');
    }

    return category;
  }

  private async getOrCreateIssueCalendar(projectId: string, user: User) {
    const existing = await this.calendarRepository.findOne({
      where: { project: { id: projectId }, name: '이슈 보드 캘린더', isActive: true },
      relations: ['folder'],
    });
    if (existing) return existing;
    const folder = await this.getOrCreateDefaultFolder(projectId, user);
    const calendar = await this.calendarRepository.save(
      this.calendarRepository.create({
        project: { id: projectId },
        name: '이슈 보드 캘린더',
        type: CalendarType.TEAM,
        owner: user,
        color: '#f59e0b',
        folder,
        isActive: true,
      }),
    );
    await this.calendarMemberRepository.save(
      this.calendarMemberRepository.create({
        calendar,
        user,
        role: CalendarMemberRole.OWNER,
      }),
    );
    return calendar;
  }

  private async getOrCreateIssueCategory(projectId: string, calendar: Calendar) {
    const existing = await this.calendarCategoryRepository.findOne({
      where: { project: { id: projectId }, calendar: { id: calendar.id }, name: '이슈', isActive: true },
      relations: ['calendar'],
    });
    if (existing) return existing;
    return this.calendarCategoryRepository.save(
      this.calendarCategoryRepository.create({
        name: '이슈',
        color: '#f97316',
        project: { id: projectId },
        calendar,
        isDefault: false,
        isActive: true,
      }),
    );
  }

  async updateEvent(
    eventId: string,
    updateCalendarEventDto: UpdateCalendarEventDto,
    user: User
  ) {
    const event = await this.calendarEventRepository.findOne({
      where: { id: eventId },
      relations: ['project', 'calendar', 'category']
    });

    if (!event) {
      throw new NotFoundException('이벤트가 없습니다.');
    }

    if (event.sourceType === 'issue') {
      throw new ForbiddenException('이슈 일정은 캘린더에서 직접 수정할 수 없습니다.');
    }

    const nextCalendarId = updateCalendarEventDto.calendarId ?? event.calendar?.id ?? event.category?.calendar?.id;
    if (nextCalendarId) {
      await this.checkCalendarAccess(nextCalendarId, user);
    } else {
      await this.checkProjectMember(event.project.id, user.id);
    }

    if (updateCalendarEventDto.categoryId) {
      const category = await this.calendarCategoryRepository.findOne({
        where: {
          id: updateCalendarEventDto.categoryId,
          isActive: true,
        },
        relations: ['calendar'],
      });
      if (!category) {
        throw new NotFoundException('카테고리가 없습니다.');
      }

      event.category = category;
      event.calendar = category.calendar;
    }

    if (updateCalendarEventDto.calendarId && !updateCalendarEventDto.categoryId) {
      const calendar = await this.checkCalendarAccess(updateCalendarEventDto.calendarId, user);
      event.calendar = calendar;
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
      relations: ['project', 'calendar', 'category']
    });

    if (!event) {
      throw new NotFoundException('이벤트가 없습니다.');
    }

    if (event.sourceType === 'issue') {
      throw new ForbiddenException('이슈 일정은 캘린더에서 직접 삭제할 수 없습니다.');
    }

    const calendarId = event.calendar?.id ?? event.category?.calendar?.id;
    if (calendarId) {
      await this.checkCalendarAccess(calendarId, user);
    } else {
      await this.checkProjectMember(event.project.id, user.id);
    }
    await this.calendarEventRepository.remove(event);

    return { success: true };
  }

  async getCategories(
    calendarId: string,
    user: User
  ) {
    const calendar = await this.checkCalendarAccess(calendarId, user);

    let categories = await this.calendarCategoryRepository.find({
      where: { calendar: { id: calendar.id }, isActive: true },
      order: { createdAt: 'ASC' },
      relations: ['calendar'],
    });

    if (categories.length === 0) {
      const defaults = [
        { name: '기본', color: calendar.color ?? '#3788d8', isDefault: true },
      ];
      categories = await this.calendarCategoryRepository.save(
        defaults.map((c) => ({
          ...c,
          project: calendar.project,
          calendar,
        })),
      );
    }

    return categories.map(mapCategory)
  }

  async createCategory(
    calendarId: string,
    createCalendarCategoryDto: CreateCalendarCategoryDto,
    user: User,
  ) {
    const calendar = await this.canManageCalendar(calendarId, user);

    return this.calendarCategoryRepository.save({
      name: createCalendarCategoryDto.name,
      color: createCalendarCategoryDto.color,
      project: calendar.project,
      calendar,
    });
  }

  async updateCategory(
    categoryId: string,
    updateCalendarCategoryDto: UpdateCalendarCategoryDto,
    user: User,
  ) {
    const category = await this.calendarCategoryRepository.findOne({
      where: { id: categoryId },
      relations: ['project', 'calendar'],
    });

    if (!category) {
      throw new NotFoundException('카테고리가 없습니다.');
    }

    await this.canManageCalendar(category.calendar?.id ?? '', user);

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
      relations: ['project', 'calendar'],
    });

    if (!category) {
      throw new NotFoundException('카테고리가 없습니다.');
    }

    if (category.isDefault) {
      throw new ForbiddenException('기본 카테고리는 삭제할 수 없습니다.');
    }

    await this.canManageCalendar(category.calendar?.id ?? '', user);

    category.isActive = false;
    return this.calendarCategoryRepository.save(category);
  }

  async createEventFromIssue(
    issue: Issue
  ) {
    const fullIssue = issue.creator
      ? issue
      : await this.issueRepository.findOne({
          where: { id: issue.id },
          relations: ['creator', 'project'],
        });
    if (!fullIssue) {
      throw new NotFoundException('이슈를 찾을 수 없습니다.');
    }
    const owner = fullIssue.creator;
    const calendar = await this.getOrCreateIssueCalendar(fullIssue.project.id, owner);
    const category = await this.getOrCreateIssueCategory(fullIssue.project.id, calendar);

    return this.calendarEventRepository.save({
      title: fullIssue.title,
      project: { id: fullIssue.project.id },
      calendar,
      category,
      createdBy: owner,
      startAt: fullIssue.startAt,
      endAt: fullIssue.endAt,
      linkedIssueId: fullIssue.id,
      sourceType: 'issue',
    });
  }

  async updateEventFromIssue(issue: Issue) {
    if (!issue.calendarEventId) return;

    const fullIssue = issue.creator
      ? issue
      : await this.issueRepository.findOne({
          where: { id: issue.id },
          relations: ['creator', 'project'],
        });
    if (!fullIssue) return;
    const owner = fullIssue.creator;
    const calendar = await this.getOrCreateIssueCalendar(fullIssue.project.id, owner);
    const category = await this.getOrCreateIssueCategory(fullIssue.project.id, calendar);
    const event = await this.calendarEventRepository.findOne({
      where: { id: issue.calendarEventId },
      relations: ['category', 'calendar'],
    });
    if (!event) return;
    event.title = fullIssue.title;
    event.startAt = fullIssue.startAt;
    event.endAt = fullIssue.endAt;
    event.calendar = calendar;
    event.category = category;
    await this.calendarEventRepository.save(event);
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
      relations: ['createdBy', 'category', 'category.calendar', 'calendar'],
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
