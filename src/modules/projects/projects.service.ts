// src/modules/project/project.service.ts
import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectFavorite } from './entities/project-favorite.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { TeamPermission } from '../team/constants/team-permission.enum';
import { hasTeamPermission } from '../team/utils/team-permissions';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRole } from './constants/project-role.enum';
import { Channel } from '../chat/entities/channel.entity';
import { ChannelMember } from '../chat/entities/channel-member.entity';
import { CalendarService } from '../calendar/calendar.service';
import { DocsService } from '../docs/docs.service';
import { IssuesService } from '../issues/issues.service';
import { IssueStatus } from '../issues/constants/issue-status.enum';
import { CalendarCategory } from '../calendar/entities/calendar-category.entity';
import { Calendar } from '../calendar/entities/calendar.entity';
import { CalendarMember } from '../calendar/entities/calendar-member.entity';
import { CalendarFolder } from '../calendar/entities/calendar-folder.entity';
import { CalendarMemberRole } from '../calendar/constants/calendar-member-role.enum';
import { CalendarType } from '../calendar/constants/calendar-type.enum';
import { CalendarEvent } from '../calendar/entities/calendar-event.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(ProjectFavorite)
    private readonly projectFavoriteRepository: Repository<ProjectFavorite>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(CalendarCategory)
    private readonly calendarCategoryRepository: Repository<CalendarCategory>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarMember)
    private readonly calendarMemberRepository: Repository<CalendarMember>,
    @InjectRepository(CalendarFolder)
    private readonly calendarFolderRepository: Repository<CalendarFolder>,
    @InjectRepository(CalendarEvent)
    private readonly calendarEventRepository: Repository<CalendarEvent>,
    private readonly calendarService: CalendarService,
    private readonly docsService: DocsService,
    private readonly issuesService: IssuesService,
  ) {}

  async getProjects(teamId: string, userId?: string) {
    const projects = await this.projectRepository.find({
      where: { team: { id: teamId } },
    });

    if (!userId) return projects;

    const favorites = await this.projectFavoriteRepository
      .createQueryBuilder('favorite')
      .select('favorite.projectId', 'projectId')
      .leftJoin('favorite.project', 'project')
      .leftJoin('project.team', 'team')
      .where('favorite.userId = :userId', { userId })
      .andWhere('team.id = :teamId', { teamId })
      .getRawMany<{ projectId: string }>();

    const favoriteIds = new Set(favorites.map((favorite) => favorite.projectId));
    return projects.map((project) => ({
      ...project,
      isFavorite: favoriteIds.has(project.id),
    }));
  }

  /** 프로젝트 생성 */
  async createProject(
    teamId: string,
    createProjectDto: CreateProjectDto,
    user: User,
  ) {
    const { selectedUserIds = [] } = createProjectDto;

    // 1. 팀 멤버 확인
    const creatorTeamMember = await this.teamMemberRepository.findOne({
      where: { team: { id: teamId }, user: { id: user.id } },
      relations: ['team', 'customRole'],
    });
    if (!creatorTeamMember) {
      throw new ForbiddenException('팀 멤버 아님');
    }
    if (!hasTeamPermission(creatorTeamMember, TeamPermission.PROJECT_CREATE_DELETE)) {
      throw new ForbiddenException('프로젝트 생성 권한이 없습니다.');
    }

    // 2. 프로젝트 생성
    const project = this.projectRepository.create({
      ...createProjectDto,
      team: creatorTeamMember.team,
    });
    await this.projectRepository.save(project);

    // 3. 생성자는 자동 OWNER
    const ownerMember = await this.projectMemberRepository.create({
      project,
      user,
      role: ProjectRole.OWNER,
    });

    await this.projectMemberRepository.save(ownerMember);

    // 4. 선택된 유저들 자동 추가 (팀 멤버만)
    const teamMembers =
      selectedUserIds.length > 0
        ? await this.teamMemberRepository.find({
            where: { team: { id: teamId }, user: { id: In(selectedUserIds) } },
            relations: ['user'],
          })
        : [];
    
    const projectMembers = [ownerMember, ...teamMembers.map(teammember => ({
      project,
      user: teammember.user,
      role: ProjectRole.MEMBER,
    }))];

    for (const member of projectMembers) {
      const exists = await this.projectMemberRepository.findOne({
        where: { project: { id: project.id }, user: { id: member.user.id } },
      });
      if (!exists) {
        await this.projectMemberRepository.save(member);
      }
    }

    // 5. 기본 이슈 테이블 생성 (프로젝트)
    try {
      await this.issuesService.createIssueGroup(project.id, '프로젝트', '#38bdf8');
    } catch {
      // ignore
    }

    // 5. 프로젝트 기본 채널 가져오기 / 생성
    let defaultChannel = await this.channelRepository.findOne({
      where: { project: { id: project.id }, isDefault: true },
    });
    if (!defaultChannel) {
      defaultChannel = await this.channelRepository.save(
        this.channelRepository.create({
          name: 'general',
          project,
          isDefault: true,
        }),
      );
    }

    // 6. 채널에 프로젝트 멤버 자동 참여
    for (const member of projectMembers) {
      const exists = await this.channelMemberRepository.findOne({
        where: { channel: { id: defaultChannel.id }, user: { id: member.user.id } },
      });
      if (!exists) {
        await this.channelMemberRepository.save(
          this.channelMemberRepository.create({
            channel: defaultChannel,
            user: member.user,
          }),
        );
      }
    }

    // 7. 캘린더 기본 생성 (폴더 + 프로젝트 캘린더 1개 + 기본 카테고리 + 기본 이벤트)
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1시간 기본
    const defaultFolder = await this.calendarFolderRepository.save(
      this.calendarFolderRepository.create({
        project,
        name: project.name,
        createdBy: user,
        isActive: true,
      }),
    );
    const baseCalendar = await this.calendarRepository.save(
      this.calendarRepository.create({
        project,
        name: '프로젝트 캘린더',
        type: CalendarType.TEAM,
        owner: user,
        color: '#3b82f6',
        folder: defaultFolder,
      }),
    );
    await this.calendarMemberRepository.save(
      this.calendarMemberRepository.create({
        calendar: baseCalendar,
        user,
        role: CalendarMemberRole.OWNER,
      }),
    );
    const defaultCategories = [
      { name: '일정', color: '#3788d8', isDefault: true },
      { name: '회의', color: '#2ecc71' },
      { name: '마감', color: '#e74c3c' },
      { name: '개인', color: '#9b59b6' },
    ];

    const savedCategories = await this.calendarCategoryRepository.save(
      defaultCategories.map((c) => ({
        ...c,
        project,
        calendar: baseCalendar,
      })),
    );

    const defaultCategory = savedCategories.find((c) => c.isDefault);

    if (defaultCategory) {
      await this.calendarService.createEvent(project.id, {
        title: '프로젝트 시작',
        calendarId: baseCalendar.id,
        categoryId: defaultCategory.id,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      }, user);
    }

    // 7-1. 개인 캘린더 자동 생성
    for (const member of projectMembers) {
      await this.calendarService.ensurePersonalCalendar(project.id, member.user);
    }

    // 8. Docs 루트 폴더/문서 생성
    const rootFolder = await this.docsService.createFolder({
      projectId: project.id,
      name: '프로젝트 폴더',
    }, user);

    await this.docsService.createDocument({
      projectId: project.id,
      title: '첫 문서',
      content: '프로젝트 문서 작성 시작',
      folderId: rootFolder.id,
    }, user);

    // 9. Issue 기본 업무 생성
    const starts = new Date();
    const ends = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000); // 1주 기본

    const issue = await this.issuesService.createIssue(project.id, {
      title: '첫 업무',
      progress: 0,
      status: IssueStatus.PLANNED,
      startAt: starts.toISOString(),
      endAt: ends.toISOString(),
    }, user);


    return project;
  }

  /** 프로젝트 멤버 추가 */
  async addProjectMember(projectId: string, userId: string, role: ProjectRole, actor: User) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['team', 'channels'],
    });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }
    const actorTeamMember = await this.teamMemberRepository.findOne({
      where: { team: { id: project.team.id }, user: { id: actor.id } },
      relations: ['customRole'],
    });
    if (!actorTeamMember || !hasTeamPermission(actorTeamMember, TeamPermission.PROJECT_INVITE_MEMBER)) {
      throw new ForbiddenException('프로젝트 멤버 초대 권한이 없습니다.');
    }

    // 팀 멤버만 추가 가능
    const teamMember = await this.teamMemberRepository.findOne({
      where: { team: { id: project.team.id }, user: { id: userId } },
      relations: ['user'],
    });
    if (!teamMember) {
      throw new ForbiddenException('팀 멤버만 추가 가능');
    }

    const exists = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (exists) {
      throw new ConflictException('이미 프로젝트 멤버');
    }

    const newMember = await this.projectMemberRepository.save(
      this.projectMemberRepository.create({
        project: { id: projectId } as Project,
        user: { id: userId } as User,
        role
      }),
    );

    // 프로젝트 기본 채널에 자동 참여
    const defaultChannel = project.channels.find(c => c.isDefault);
    if (defaultChannel) {
      const channelExists = await this.channelMemberRepository.findOne({
        where: { channel: { id: defaultChannel.id }, user: { id: userId } },
      });
      if (!channelExists) {
        await this.channelMemberRepository.save(
          this.channelMemberRepository.create({
            channel: defaultChannel,
            user: { id: userId } as User,
          }),
        );
      }
    }

    await this.calendarService.ensurePersonalCalendar(projectId, teamMember.user);

    return newMember;
  }

  /** 프로젝트 멤버 목록 조회 */
  async getProjectMembers(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user'],
    });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }

    return project.members.map((member) => ({
      userId: member.user.id,
      name: member.user.displayName ?? member.user.name,
      email: member.user.email,
      avatarUrl: member.user.avatarUrl,
      backgroundImageUrl: member.user.backgroundImageUrl,
      bio: member.user.bio,
      role: member.role,
    }));
  }

  async getMemberAnalytics(
    projectId: string,
    opts: { granularity: 'hourly' | 'daily' | 'monthly'; date?: string; month?: string; year?: string },
  ) {
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

    const rows = await this.projectMemberRepository
      .createQueryBuilder('member')
      .where('member.projectId = :projectId', { projectId })
      .andWhere('member.joinedAt >= :start', { start })
      .andWhere('member.joinedAt < :end', { end })
      .select(['member.joinedAt'])
      .getMany();

    rows.forEach((row) => {
      const dt = new Date(row.joinedAt);
      if (granularity === 'hourly') counts[dt.getHours()] += 1;
      else if (granularity === 'daily') counts[dt.getDate() - 1] += 1;
      else counts[dt.getMonth()] += 1;
    });

    return { granularity, counts };
  }

  /** 프로젝트 멤버 역할 변경 */
  async updateMemberRole(projectId: string, userId: string, newRole: ProjectRole, actor: User) {
    const member = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!member) {
      throw new NotFoundException('프로젝트 멤버 없음');
    }
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['team'],
    });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }
    const actorTeamMember = await this.teamMemberRepository.findOne({
      where: { team: { id: project.team.id }, user: { id: actor.id } },
      relations: ['customRole'],
    });
    if (!actorTeamMember || !hasTeamPermission(actorTeamMember, TeamPermission.PROJECT_UPDATE_ROLE)) {
      throw new ForbiddenException('프로젝트 역할 변경 권한이 없습니다.');
    }

    member.role = newRole;
    return this.projectMemberRepository.save(member);
  }

  /** 프로젝트 멤버 제거 */
  async removeMember(projectId: string, userId: string, actor: User) {
    const member = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!member) {
      throw new NotFoundException('프로젝트 멤버 없음');
    }
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['team'],
    });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }
    const actorTeamMember = await this.teamMemberRepository.findOne({
      where: { team: { id: project.team.id }, user: { id: actor.id } },
      relations: ['customRole'],
    });
    if (!actorTeamMember || !hasTeamPermission(actorTeamMember, TeamPermission.PROJECT_INVITE_MEMBER)) {
      throw new ForbiddenException('프로젝트 멤버 삭제 권한이 없습니다.');
    }

    const personalCalendars = await this.calendarRepository.find({
      where: { project: { id: projectId }, type: CalendarType.PERSONAL, owner: { id: userId }, isActive: true },
      relations: ['owner'],
    });
    if (personalCalendars.length > 0) {
      for (const calendar of personalCalendars) {
        calendar.isActive = false;
        await this.calendarRepository.save(calendar);
      }
    }

    await this.calendarEventRepository.delete({
      project: { id: projectId },
      createdBy: { id: userId },
    });

    return this.projectMemberRepository.remove(member);
  }

  /** 프로젝트 정보 업데이트 (이름, 설명, 아이콘) */
  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto, actor: User) {
    const project = await this.projectRepository.findOne({ where: { id: projectId }, relations: ['team'] });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }
    const actorTeamMember = await this.teamMemberRepository.findOne({
      where: { team: { id: project.team?.id }, user: { id: actor.id } },
      relations: ['customRole'],
    });
    if (!actorTeamMember || !hasTeamPermission(actorTeamMember, TeamPermission.PROJECT_CREATE_DELETE)) {
      throw new ForbiddenException('프로젝트 수정 권한이 없습니다.');
    }

    if (updateProjectDto.name !== undefined) project.name = updateProjectDto.name;
    if (updateProjectDto.description !== undefined) project.description = updateProjectDto.description;
    if (updateProjectDto.iconType !== undefined) project.iconType = updateProjectDto.iconType;
    if (updateProjectDto.iconValue !== undefined) project.iconValue = updateProjectDto.iconValue;

    return this.projectRepository.save(project);
  }

  /** 프로젝트 복제 */
  async cloneProject(teamId: string, projectId: string, user: User) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, team: { id: teamId } },
      relations: ['team'],
    });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }

    const name = `${project.name} Copy`;
    const dto: CreateProjectDto = {
      name,
      description: project.description,
      iconType: project.iconType,
      iconValue: project.iconValue,
    };

    return this.createProject(teamId, dto, user);
  }

  /** 프로젝트 삭제 */
  async deleteProject(teamId: string, projectId: string, actor: User) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, team: { id: teamId } },
    });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }
    const actorTeamMember = await this.teamMemberRepository.findOne({
      where: { team: { id: teamId }, user: { id: actor.id } },
      relations: ['customRole'],
    });
    if (!actorTeamMember || !hasTeamPermission(actorTeamMember, TeamPermission.PROJECT_CREATE_DELETE)) {
      throw new ForbiddenException('프로젝트 삭제 권한이 없습니다.');
    }

    // 채널 멤버 → 채널 순서로 정리 (FK 제약 회피)
    const channels = await this.channelRepository.find({
      where: { project: { id: projectId } },
    });
    if (channels.length > 0) {
      const channelIds = channels.map((channel) => channel.id);
      await this.channelMemberRepository.delete({
        channel: { id: In(channelIds) },
      });
    }

    await this.projectRepository.remove(project);
    return { success: true };
  }

  async addFavorite(projectId: string, user: User) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }

    const exists = await this.projectFavoriteRepository.findOne({
      where: { project: { id: projectId }, user: { id: user.id } },
    });
    if (exists) return exists;

    return this.projectFavoriteRepository.save(
      this.projectFavoriteRepository.create({
        project,
        user,
      }),
    );
  }

  async removeFavorite(projectId: string, user: User) {
    const favorite = await this.projectFavoriteRepository.findOne({
      where: { project: { id: projectId }, user: { id: user.id } },
    });
    if (!favorite) return { success: true };
    await this.projectFavoriteRepository.remove(favorite);
    return { success: true };
  }
}
