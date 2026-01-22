// src/modules/issue/issue.service.ts
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
      where: { project: { id: projectId }, parent: null },
      relations: [
        'creator',
        'assignee',
        'comments',
        'comments.author',
        'subtasks',
        'subtasks.creator',
        'subtasks.assignee',
      ],
      order: { createdAt: 'ASC' },
    });

    return issues.map(mapIssuesToResponse);
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
    
    const issue = this.issueRepository.create({
      ...createIssueDto,
      project,
      creator: user,
      parent,
      assignee,
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
      relations: ['assignee', 'project', 'project.team']
    });

    if (!issue) {
      throw new NotFoundException('해당 이슈가 없습니다.');
    }

    const before = snapshot(issue);
    const beforeStartAt = issue.startAt;
    const beforeEndAt = issue.endAt;
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
      where: { project: { id: projectId }, parent: null },
      relations: [
        'creator',
        'assignee',
        'comments',
        'comments.author',
        'subtasks',
        'subtasks.creator',
        'subtasks.assignee',
        'subtasks.comments',
        'subtasks.comments.author',
      ],
      order: { createdAt: 'ASC' },
    });

    return issues.map(mapIssuesToResponse);
  }

  /** 하위 업무 추가 */
  async addSubtask(
    addSubtaskDto: AddSubtaskDto,
    actor: User,
  ) {
    const parent = await this.issueRepository.findOne({
      where: { id: addSubtaskDto.parentId },
      relations: ['subtasks', 'project', 'project.team'],
    });
    if (!parent) {
      throw new NotFoundException('상위 업무가 없습니다.');
    }

    const assignee = addSubtaskDto.assigneeId ? { id: addSubtaskDto.assigneeId } : null;
    const subtask = this.issueRepository.create({
      title: addSubtaskDto.title,
      parent,
      assignee,
      startAt: addSubtaskDto.startAt ? new Date(addSubtaskDto.startAt) : null,
      endAt: addSubtaskDto.dueAt ? new Date(addSubtaskDto.dueAt) : null,
    });

    const saved = await this.issueRepository.save(subtask);
    await this.activityLogService.log({
      actorId: actor.id,
      projectId: parent.project.id,
      teamId: parent.project.team.id,
      targetType: ActivityTargetType.ISSUE,
      targetId: parent.id,
      action: IssueActivityAction.SUBTASK_ADDED,
      payload: {
        after: { subtaskId: subtask.id, title: subtask.title },
      },
    });

    await this.recalculateParentProgress(parent);
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

  /** 하위 업무 삭제 */
  async removeSubtask(
    subtaskId: string,
    user: User,
  ) {
    const subtask = await this.issueRepository.findOne({
      where: { id: subtaskId },
      relations: ['parent', 'parent.project', 'parent.project.team'],
    });
    if (!subtask) {
      throw new NotFoundException('하위 업무가 없습니다.');
    }

    const parent = subtask.parent;
    const payload = {
      subtaskId: subtask.id,
      title: subtask.title,
    };

    await this.issueRepository.remove(subtask);
    if (parent) {
      await this.recalculateParentProgress(parent);
    }

    await this.activityLogService.log({
      actorId: user.id,
      projectId: parent.project.id,
      teamId: parent.project.team.id,
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
      relations: ['parent', 'project', 'project.team'],
    });

    if (!issue) {
      throw new NotFoundException('해당 이슈가 없습니다.');
    }

    const before = issue.progress;
    issue.progress = data.progress;
    await this.issueRepository.save(issue);

    if (issue.parent) {
      await this.recalculateParentProgress(issue.parent);
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
    parent: Issue,
  ) {
    const subtasks = await this.issueRepository.find({
      where: { parent: { id: parent.id } }
    });
    if (!subtasks.length) return;

    parent.progress = Math.floor(subtasks.reduce((sum, s) => sum + s.progress, 0) / subtasks.length);
    await this.issueRepository.save(parent);

    // 재귀적으로 상위 업무까지 반영
    if (parent.parent) {
      await this.recalculateParentProgress(parent.parent);
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

  async getProjectGantt(
    projectId: string
  ): Promise<GanttIssueDto[]> {
    const issues = await this.issueRepository.find({
      where: { project: { id: projectId } },
      relations: ['assignee', 'parent'],
    });

    return issues
      .filter(issue => issue.startAt && issue.endAt)
      .map(issue => ({
        id: issue.id,
        title: issue.title,
        startAt: issue.startAt,
        endAt: issue.endAt,
        progress: issue.progress,
        parentId: issue.parent?.id,
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