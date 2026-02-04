// src/modules/issue/issue.service.ts
import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { IssueComment } from './entities/issue-comment.entity';
import { IssueResponseDto } from './dto/issue-response.dto';
import { mapIssuesToResponse } from './utils/issues.mapper';
import { IssueStatus } from './constants/issue-status.enum';
import { IssuePriority } from './constants/issue-priority.enum';
import { AddSubtaskDto } from './dto/add-subtask.dto';
import { CalendarService } from '../calendar/calendar.service';
import { syncCalendarEvent } from './utils/sync-calendar-event';
import { GanttIssueDto } from './dto/gantt-issue.dto';
import { ISSUE_STATUS_COLOR } from './constants/issue-color-map';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { snapshot } from './utils/snapshot';
import { ActivityTargetType } from '../activity-log/constants/activity-target-type.enum';
import { IssueActivityAction } from './constants/issue-activity-action.enum';
import { CalendarActivityAction } from '../calendar/constants/calendar-activity-action.enum';
import * as jwt from 'jsonwebtoken';
import { AppConfigService } from 'src/config/app/config.service';
import { toTime } from './utils/to-time.util';
import { IssueGroup } from './entities/issue-group.entity';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(IssueComment)
    private readonly issueCommentRepository: Repository<IssueComment>,
    @InjectRepository(IssueGroup)
    private readonly issueGroupRepository: Repository<IssueGroup>,
    private readonly calendarService: CalendarService,
    private readonly activityLogService: ActivityLogService,
    private readonly appConfigService: AppConfigService,
  ) {}

  async verifyToken(token: string): Promise<User> {
    try {
      const payload: any = jwt.verify(token, this.appConfigService.jwtSecret);
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('유저 없음');
      }
      return user;
    } catch (err) {
      throw new UnauthorizedException('유효하지 않은 토큰');
    }
  }

  /** 프로젝트별 Kanban 보드 조회 */
  async getProjectBoard(
    projectId: string,
  ) {
    const issues = await this.issueRepository.find({
      where: { project: { id: projectId } },
      relations: ['creator', 'assignee', 'group', 'comments', 'comments.author'],
      order: { createdAt: 'ASC' },
    });

    const roots = this.buildIssueTree(issues);
    return roots.map(mapIssuesToResponse);
  }

  /** 프로젝트 대시보드 통계 */
  async getProjectDashboard(
    projectId: string,
  ) {
    const issues = await this.issueRepository.find({
      where: { project: { id: projectId } },
      relations: ['assignee'],
    });

    const statusCount: Record<string, number> = {};
    Object.values(IssueStatus).forEach(s => (statusCount[s] = 0));

    let totalProgress = 0;
    const assigneeStats: Record<string, { issueCount: number; totalProgress: number }> = {};
    const overdueIssues: Issue[] = [];
    const now = new Date();

    for (const issue of issues) {
      statusCount[issue.status] += 1;
      totalProgress += issue.progress;

      if (issue.assignee) {
        if (!assigneeStats[issue.assignee.id]) {
          assigneeStats[issue.assignee.id] = { issueCount: 0, totalProgress: 0 };
        }
        assigneeStats[issue.assignee.id].issueCount += 1;
        assigneeStats[issue.assignee.id].totalProgress += issue.progress;
      }

      if (issue.endAt && issue.endAt < now && issue.status !== IssueStatus.DONE) {
        overdueIssues.push(issue);
      }
    }

    const avgProgress = issues.length > 0 ? Math.floor(totalProgress / issues.length) : 0;
    const assigneeStatsArray = Object.entries(assigneeStats).map(([userId, stat]) => ({
      userId,
      issueCount: stat.issueCount,
      avgProgress: Math.floor(stat.totalProgress / stat.issueCount),
    }));

    return {
      totalIssues: issues.length,
      statusCount,
      avgProgress,
      assigneeStats: assigneeStatsArray,
      overdueIssues,
    };
  }

  async getIssueAnalytics(
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

    const rows = await this.issueRepository
      .createQueryBuilder('issue')
      .where('issue.projectId = :projectId', { projectId })
      .andWhere('issue.createdAt >= :start', { start })
      .andWhere('issue.createdAt < :end', { end })
      .select(['issue.createdAt'])
      .getMany();

    rows.forEach((row) => {
      const dt = new Date(row.createdAt);
      if (granularity === 'hourly') counts[dt.getHours()] += 1;
      else if (granularity === 'daily') counts[dt.getDate() - 1] += 1;
      else counts[dt.getMonth()] += 1;
    });

    return { granularity, counts };
  }

  /** 이슈 생성 */
  async createIssue(
    projectId: string,
    createIssueDto: CreateIssueDto,
    user: User,
  ): Promise<IssueResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['team'],
    });
    if (!project) {
      throw new NotFoundException('프로젝트가 없습니다.');
    }

    const parent = createIssueDto.parentId
      ? await this.issueRepository.findOne({ where: { id: createIssueDto.parentId } })
      : null;

    if (createIssueDto.parentId && !parent) {
      throw new NotFoundException('상위 업무가 없습니다.');
    }

    const assignee = createIssueDto.assigneeId
      ? await this.userRepository.findOne({ where: { id: createIssueDto.assigneeId } })
      : null;

    const group = createIssueDto.groupId
      ? await this.issueGroupRepository.findOne({ where: { id: createIssueDto.groupId, project: { id: projectId } } })
      : null;
    if (createIssueDto.groupId && !group) {
      throw new NotFoundException('이슈 테이블이 없습니다.');
    }
    
    const inheritedGroupId = !createIssueDto.groupId && parent ? await this.findNearestGroupId(parent) : null;

    const issue = this.issueRepository.create({
      ...createIssueDto,
      project,
      projectId: project.id,
      creator: user,
      creatorId: user.id,
      parentId: parent?.id ?? null,
      assignee,
      assigneeId: assignee?.id ?? null,
      group,
      groupId: group?.id ?? inheritedGroupId ?? null,
      status: createIssueDto.status ?? IssueStatus.PLANNED,
      progress: createIssueDto.progress ?? 0,
      startAt: createIssueDto.startAt ? new Date(createIssueDto.startAt) : null,
      endAt: createIssueDto.endAt ? new Date(createIssueDto.endAt) : null,
    });


    const saved = await this.issueRepository.save(issue);
    await syncCalendarEvent(saved, this.calendarService, this.issueRepository);

    await this.activityLogService.log({
      actorId: user.id,
      projectId: issue.project.id,
      teamId: issue.project.team.id,
      targetType: ActivityTargetType.ISSUE,
      targetId: issue.id,
      action: IssueActivityAction.CREATED,
      payload: {
        before: snapshot(saved),
        after: snapshot(saved),
      },
    });

    return mapIssuesToResponse(saved);
  }

  /** 이슈 수정 */
  async updateIssue(
    issueId: string,
    updateIssueDto: UpdateIssueDto,
    user: User,
  ) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['assignee', 'project', 'project.team', 'group']
    });

    if (!issue) {
      throw new NotFoundException('해당 이슈가 없습니다.');
    }

    const before = snapshot(issue);
    const beforeStartAt = issue.startAt;
    const beforeEndAt = issue.endAt;
    if (updateIssueDto.groupId) {
      const group = await this.issueGroupRepository.findOne({ where: { id: updateIssueDto.groupId, project: { id: issue.project.id } } });
      if (!group) {
        throw new NotFoundException('이슈 테이블이 없습니다.');
      }
      issue.group = group;
    }

    Object.assign(issue, {
      ...updateIssueDto,
      startAt: updateIssueDto.startAt ? new Date(updateIssueDto.startAt) : issue.startAt,
      endAt: updateIssueDto.endAt ? new Date(updateIssueDto.endAt) : issue.endAt,
    });

    const saved = await this.issueRepository.save(issue);
    const after = snapshot(saved);

    const isDateChanged =
      toTime(beforeStartAt) !== toTime(saved.startAt) ||
      toTime(beforeEndAt) !== toTime(saved.endAt);

    if (isDateChanged) {
      await syncCalendarEvent(saved, this.calendarService, this.issueRepository);

      await this.activityLogService.log({
        actorId: user.id,
        projectId: saved.project.id,
        teamId: saved.project.team.id,
        targetType: ActivityTargetType.CALENDAR,
        targetId: saved.calendarEventId!,
        action: CalendarActivityAction.MOVED,
        payload: {
          before: {
            startAt: beforeStartAt,
            endAt: beforeEndAt,
          },
          after: {
            startAt: saved.startAt,
            endAt: saved.endAt,
          },
          meta: {
            issueId: saved.id,
          },
        },
      });
    };

    const teamId = saved.project?.team?.id ?? null;
    if (teamId) {
      await this.activityLogService.log({
        actorId: user.id,
        projectId: saved.project.id,
        teamId,
        targetType: ActivityTargetType.ISSUE,
        targetId: saved.id,
        action: IssueActivityAction.UPDATED,
        payload: { before, after },
      });
    }
    return mapIssuesToResponse(saved);
  }

  async removeIssue(issueId: string, user: User) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['project', 'project.team'],
    });
    if (!issue) {
      throw new NotFoundException('해당 이슈가 없습니다.');
    }

    await this.issueRepository.remove(issue);

    await this.activityLogService.log({
      actorId: user.id,
      projectId: issue.project.id,
      teamId: issue.project.team.id,
      targetType: ActivityTargetType.ISSUE,
      targetId: issue.id,
      action: IssueActivityAction.DELETED,
      payload: {
        before: snapshot(issue),
      },
    });

    return { ok: true };
  }

  async deleteIssue(
    issueId: string,
    user: User,
  ) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['project', 'project.team'],
    });
    
    if (!issue) {
      throw new NotFoundException('해당 이슈가 없습니다.');
    }

    if (issue.calendarEventId) {
      await this.calendarService.deleteEventByIssue(issue);
    }

    await this.activityLogService.log({
      actorId: user.id,
      projectId: issue.project.id,
      teamId: issue.project.team.id,
      targetType: ActivityTargetType.ISSUE,
      targetId: issue.id,
      action: IssueActivityAction.DELETED,
      payload: {
        before: snapshot(issue),
      },
    });

    await this.issueRepository.remove(issue);
  }

  /** 담당자 지정 */
  async assignIssue(
    issueId: string,
    userId: string,
    actor: User,
  ) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['assignee', 'project', 'project.team'],
    });
    if (!issue) {
      throw new NotFoundException('해당 이슈가 없습니다.');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('사용자가 없습니다.');
    }

    const beforeAssigneeId = issue.assignee?.id ?? null;
    issue.assignee = user;

    const saved = await this.issueRepository.save(issue);

    await this.activityLogService.log({
      actorId: actor.id,
      projectId: saved.project.id,
      teamId: saved.project.team.id,
      targetType: ActivityTargetType.ISSUE,
      targetId: saved.id,
      action: IssueActivityAction.ASSIGNED,
      payload: {
        before: { assigneeId: beforeAssigneeId },
        after: { assigneeId: user.id },
      },
    });

    return mapIssuesToResponse(saved);
  }

  /** 프로젝트 내 모든 이슈 조회 */
  async getProjectIssues(
    projectId: string,
  ): Promise<IssueResponseDto[]> {
    const issues = await this.issueRepository.find({
      where: { project: { id: projectId } },
      relations: ['creator', 'assignee', 'group', 'comments', 'comments.author'],
      order: { createdAt: 'ASC' },
    });

    const roots = this.buildIssueTree(issues);
    return roots.map(mapIssuesToResponse);
  }

  async listIssueGroups(projectId: string) {
    const groups = await this.issueGroupRepository.find({
      where: { project: { id: projectId } },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return groups;
  }

  async createIssueGroup(projectId: string, name?: string, color?: string) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('프로젝트가 없습니다.');
    }
    const count = await this.issueGroupRepository.count({ where: { project: { id: projectId } } });
    const palette = ['#f87171', '#60a5fa', '#fbbf24', '#a78bfa', '#34d399'];
    const group = this.issueGroupRepository.create({
      name: name?.trim() || `새 테이블 ${count + 1}`,
      color: color || palette[count % palette.length],
      sortOrder: count,
      project,
    });
    return this.issueGroupRepository.save(group);
  }

  async updateIssueGroup(projectId: string, groupId: string, patch: { name?: string; color?: string; sortOrder?: number }) {
    const group = await this.issueGroupRepository.findOne({ where: { id: groupId, project: { id: projectId } } });
    if (!group) {
      throw new NotFoundException('이슈 테이블이 없습니다.');
    }
    if (typeof patch.name === 'string') group.name = patch.name;
    if (typeof patch.color === 'string') group.color = patch.color;
    if (typeof patch.sortOrder === 'number') group.sortOrder = patch.sortOrder;
    return this.issueGroupRepository.save(group);
  }

  async removeIssueGroup(projectId: string, groupId: string) {
    const group = await this.issueGroupRepository.findOne({ where: { id: groupId, project: { id: projectId } }, relations: ['issues'] });
    if (!group) {
      throw new NotFoundException('이슈 테이블이 없습니다.');
    }
    if (group.issues?.length) {
      await this.issueRepository.update({ group: { id: group.id } }, { group: null });
    }
    await this.issueGroupRepository.remove(group);
    return { ok: true };
  }

  /** 하위 업무 추가 */
  async addSubtask(
    addSubtaskDto: AddSubtaskDto,
    actor: User,
  ) {
    const parent = await this.issueRepository.findOne({
      where: { id: addSubtaskDto.parentId },
    });
    if (!parent) {
      throw new NotFoundException('상위 업무가 없습니다.');
    }

    let projectId = parent.projectId ?? null;
    let groupId = parent.groupId ?? null;
    let cursorParentId = parent.parentId ?? null;
    while (!groupId && cursorParentId) {
      const cursor = await this.issueRepository.findOne({ where: { id: cursorParentId } });
      if (!cursor) break;
      if (!projectId && cursor.projectId) projectId = cursor.projectId;
      if (!groupId && cursor.groupId) groupId = cursor.groupId;
      cursorParentId = cursor.parentId ?? null;
    }
    if (!projectId) {
      throw new NotFoundException('프로젝트 정보를 찾을 수 없습니다.');
    }
    const project = await this.projectRepository.findOne({ where: { id: projectId }, relations: ['team'] });
    if (!project) {
      throw new NotFoundException('프로젝트 정보를 찾을 수 없습니다.');
    }
    const team = project.team;

    const assigneeId = addSubtaskDto.assigneeId ?? null;
    const now = new Date();
    const startAt = addSubtaskDto.startAt ? new Date(addSubtaskDto.startAt) : null;
    const endAt = addSubtaskDto.dueAt ? new Date(addSubtaskDto.dueAt) : null;

    const subtask = this.issueRepository.create({
      title: addSubtaskDto.title,
      creatorId: actor.id,
      projectId: project.id,
      groupId: groupId,
      parentId: parent.id,
      assigneeId,
      status: IssueStatus.PLANNED,
      priority: IssuePriority.MEDIUM,
      progress: 0,
      startAt,
      endAt,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.issueRepository.save(subtask);
    await this.activityLogService.log({
      actorId: actor.id,
      projectId: project.id,
      teamId: team.id,
      targetType: ActivityTargetType.ISSUE,
      targetId: parent.id,
      action: IssueActivityAction.SUBTASK_ADDED,
      payload: {
        after: { subtaskId: saved.id, title: addSubtaskDto.title },
      },
    });

    await this.recalculateParentProgress(parent.id);
    return saved;
  }

  /** 커멘트 추가 */
  async addComment(
    issueId: string,
    user: User,
    content: string,
  ) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['project', 'project.team'],
    });
    if (!issue) {
      throw new NotFoundException('해당 이슈가 없습니다.');
    }

    const comment = this.issueCommentRepository.create({ issue, author: user, content });
    const saved = await this.issueCommentRepository.save(comment);

    await this.activityLogService.log({
      actorId: user.id,
      projectId: issue.project.id,
      teamId: issue.project.team.id,
      targetType: ActivityTargetType.ISSUE,
      targetId: issue.id,
      action: IssueActivityAction.COMMENTED,
      payload: {
        meta: {
          commentId: saved.id,
          preview: content.slice(0, 50),
        },
      },
    });

    return saved;
  }

  /** 댓글 삭제 */
  async removeComment(
    commentId: string,
    user: User,
  ) {
    const comment = await this.issueCommentRepository.findOne({
      where: { id: commentId },
      relations: ['issue', 'issue.project', 'issue.project.team'],
    });

    if (!comment) {
      throw new NotFoundException('댓글이 없습니다.');
    }

    const issueId = comment.issue?.id ?? null;
    await this.issueCommentRepository.remove(comment);

    return { issueId, commentId };
  }

  /** 하위 업무 삭제 */
  async removeSubtask(
    subtaskId: string,
    user: User,
  ) {
    const subtask = await this.issueRepository.findOne({
      where: { id: subtaskId },
    });
    if (!subtask) {
      throw new NotFoundException('하위 업무가 없습니다.');
    }

    const parentId = subtask.parentId ?? null;
    const parent = parentId ? await this.issueRepository.findOne({ where: { id: parentId } }) : null;
    if (!parent) {
      await this.issueRepository.remove(subtask);
      return { parentId: null };
    }

    const project = await this.projectRepository.findOne({ where: { id: parent.projectId }, relations: ['team'] });
    if (!project) {
      await this.issueRepository.remove(subtask);
      return { parentId: parent.id };
    }
    const payload = {
      subtaskId: subtask.id,
      title: subtask.title,
    };

    await this.issueRepository.remove(subtask);
    await this.recalculateParentProgress(parent.id);

    await this.activityLogService.log({
      actorId: user.id,
      projectId: project.id,
      teamId: project.team.id,
      targetType: ActivityTargetType.ISSUE,
      targetId: parent.id,
      action: IssueActivityAction.SUBTASK_REMOVED,
      payload: {
        before: payload,
      },
    });

    return parent ? { parentId: parent.id } : { parentId: null };
  }

  /** 진행률 업데이트 */
  async updateProgress(
    issueId: string,
    data: { progress: number },
    user: User,
  ) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['project', 'project.team'],
    });

    if (!issue) {
      throw new NotFoundException('해당 이슈가 없습니다.');
    }

    const before = issue.progress;
    issue.progress = data.progress;
    await this.issueRepository.save(issue);

    if (issue.parentId) {
      await this.recalculateParentProgress(issue.parentId);
    }

    await this.activityLogService.log({
      actorId: user.id,
      projectId: issue.project.id,
      teamId: issue.project.team.id,
      targetType: ActivityTargetType.ISSUE,
      targetId: issue.id,
      action: IssueActivityAction.PROGRESS_UPDATED,
      payload: {
        before: { progress: before },
        after: { progress: data.progress },
      },
    });

    return issue;
  }

  /** 상위 업무 진행률 재계산 */
  async recalculateParentProgress(
    parentId: string,
  ) {
    const parent = await this.issueRepository.findOne({ where: { id: parentId } });
    if (!parent) return;

    const subtasks = await this.issueRepository.find({ where: { parentId } });
    if (!subtasks.length) return;

    parent.progress = Math.floor(subtasks.reduce((sum, s) => sum + s.progress, 0) / subtasks.length);
    await this.issueRepository.save(parent);

    // 재귀적으로 상위 업무까지 반영
    if (parent.parentId) {
      await this.recalculateParentProgress(parent.parentId);
    }
  }

  /** 상태 업데이트 */
  async updateStatus(
    issueId: string,
    status: IssueStatus,
    user: User,
  ) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['project', 'project.team'],
    });
    if (!issue) {
      throw new NotFoundException('해당 이슈가 없습니다.');
    }

    const beforeStatus = issue.status;
    issue.status = status;
    await this.issueRepository.save(issue);

    await this.activityLogService.log({
      actorId: user.id,
      projectId: issue.project.id,
      teamId: issue.project.team.id,
      targetType: ActivityTargetType.ISSUE,
      targetId: issue.id,
      action: IssueActivityAction.STATUS_CHANGED,
      payload: {
        before: { status: beforeStatus },
        after: { status },
      },
    });
  }

  private buildIssueTree(issues: Issue[]): Issue[] {
    const byId = new Map<string, Issue>();
    for (const issue of issues) {
      issue.subtasks = [];
      byId.set(issue.id, issue);
    }

    const roots: Issue[] = [];
    for (const issue of issues) {
      if (issue.parentId) {
        const parent = byId.get(issue.parentId);
        if (parent) {
          parent.subtasks?.push(issue);
        } else {
          roots.push(issue);
        }
      } else {
        roots.push(issue);
      }
    }
    return roots;
  }

  private async findNearestGroupId(parent: Issue): Promise<string | null> {
    if (parent.groupId) return parent.groupId;
    let cursorParentId = parent.parentId ?? null;
    while (cursorParentId) {
      const cursor = await this.issueRepository.findOne({ where: { id: cursorParentId } });
      if (!cursor) break;
      if (cursor.groupId) return cursor.groupId;
      cursorParentId = cursor.parentId ?? null;
    }
    return null;
  }

  async getProjectGantt(
    projectId: string
  ): Promise<GanttIssueDto[]> {
    const issues = await this.issueRepository.find({
      where: { project: { id: projectId } },
      relations: ['assignee'],
    });

    return issues
      .filter(issue => issue.startAt && issue.endAt)
      .map(issue => ({
        id: issue.id,
        title: issue.title,
        startAt: issue.startAt,
        endAt: issue.endAt,
        progress: issue.progress,
        parentId: issue.parentId ?? null,
        assignee: issue.assignee
          ? { id: issue.assignee.id, name: issue.assignee.name }
          : undefined,
        color: ISSUE_STATUS_COLOR[issue.status],
      }));
  }

  async getIssueById(issueId: string): Promise<Issue> {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['assignee', 'project', 'project.team'],
    });
    if (!issue) {
      throw new NotFoundException('해당 이슈가 없습니다.');
    }
    return issue;
  }
}
