// src/modules/issue/issue.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
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

  ) {}

  /** 상태 변경 (Kanban 보드용) */
  async changeStatus(
    issueId: string,
    status: IssueStatus,
  ) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    issue.status = status;
    return this.issueRepository.save(issue);
  }

  /** 프로젝트별 Kanban 보드 조회 */
  async getProjectBoard(
    projectId: string,
  ) {
    const issues = await this.issueRepository.find({
      where: { project: { id: projectId }, parent: null },
      relations: ['assignee', 'creator', 'comments', 'comments.author', 'subtasks'],
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

    const totalIssues = issues.length;
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

    const avgProgress = totalIssues > 0 ? Math.floor(totalProgress / totalIssues) : 0;
    const assigneeStatsArray = Object.entries(assigneeStats).map(([userId, stat]) => ({
      userId,
      issueCount: stat.issueCount,
      avgProgress: Math.floor(stat.totalProgress / stat.issueCount),
    }));

    return {
      totalIssues,
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
    creator: User,
  ): Promise<IssueResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }

    const parent = createIssueDto.parentId
      ? await this.issueRepository.findOne({ where: { id: createIssueDto.parentId } })
      : null;

    if (createIssueDto.parentId && !parent) {
      throw new NotFoundException('상위 업무 없음');
    }

    const assignee = createIssueDto.assigneeId
      ? await this.userRepository.findOne({ where: { id: createIssueDto.assigneeId } })
      : null;
    
    const issue = this.issueRepository.create({
      ...createIssueDto,
      project,
      creator,
      progress: createIssueDto.progress ?? 0,
      startAt: createIssueDto.startAt ? new Date(createIssueDto.startAt) : null,
      endAt: createIssueDto.endAt ? new Date(createIssueDto.endAt) : null,
    });


    const saved = await this.issueRepository.save(issue);
    return mapIssuesToResponse(saved);
  }

  /** 이슈 수정 */
  async updateIssue(
    issueId: string,
    updateIssueDto: UpdateIssueDto,
  ) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['assignee'],
    });

    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    Object.assign(issue, {
      ...updateIssueDto,
      startAt: updateIssueDto.startAt ? new Date(updateIssueDto.startAt) : issue.startAt,
      endAt: updateIssueDto.endAt ? new Date(updateIssueDto.endAt) : issue.endAt,
    });
    const savedIssue = await this.issueRepository.save(issue);

    // 캘린더 이벤트 연동
    await syncCalendarEvent(savedIssue, this.calendarService);

    return mapIssuesToResponse(savedIssue);
  }

  /** 담당자 지정 */
  async assignIssue(
    issueId: string,
    userId: string,
  ) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    const user = await this.userRepository.findOne({ where: { id: userId }});
    if (!user) {
      throw new NotFoundException('사용자 없음');
    }

    issue.assignee = user;
    return mapIssuesToResponse(await this.issueRepository.save(issue));
  }

  /** 프로젝트 내 모든 이슈 조회 */
  async getProjectIssues(
    projectId: string,
  ): Promise<IssueResponseDto[]> {
    const issues = await this.issueRepository.find({
      where: { project: { id: projectId }, parent: null },
      relations: [
        'subtasks',
        'subtasks.subtasks',
        'assignee',
        'creator',
        'comments',
        'comments.author',
      ],
      order: { createdAt: 'ASC' },
    });

    return issues.map(mapIssuesToResponse);
  }

  /** 하위 업무 추가 */
  async addSubtask(
    addSubtaskDto: AddSubtaskDto,
  ) {
    const parent = await this.issueRepository.findOne({
      where: { id: addSubtaskDto.parentId },
      relations: ['subtasks']
    });
    if (!parent) {
      throw new NotFoundException('상위 업무 없음');
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
    await this.recalculateParentProgress(parent);
    return saved;
  }

  /** 커멘트 추가 */
  async addComment(
    issueId: string,
    user: User,
    content: string,
  ) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    const comment = this.issueCommentRepository.create({ issue, author: user, content });
    return this.issueCommentRepository.save(comment);
  }

  /** 하위 업무 삭제 */
  async removeSubtask(
    subtaskId: string,
  ) {
    const subtask = await this.issueRepository.findOne({
      where: { id: subtaskId },
      relations: ['parent']
    });
    if (!subtask) {
      throw new NotFoundException('하위 업무 없음');
    }

    const parent = subtask.parent;
    await this.issueRepository.remove(subtask);
    if (parent) {
      await this.recalculateParentProgress(parent);
    }

    return parent ? { parentId: parent.id } : { parentId: null };
  }

  /** 진행률 업데이트 */
  async updateProgress(
    issueId: string,
    data: { progress: number },
  ) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['parent']
    });
    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    issue.progress = data.progress;
    await this.issueRepository.save(issue);

    if (issue.parent) {
      await this.recalculateParentProgress(issue.parent);
    }

    return issue;
  }

  /** 상위 업무 진행률 재계산 */
  async recalculateParentProgress(
    parent: Issue,
  ) {
    const subtasks = await this.issueRepository.find({ where: { parent: { id: parent.id } } });
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
  ) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    issue.status = status;
    return this.issueRepository.save(issue);
  }
}