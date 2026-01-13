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
import { WsAddSubtaskDto } from './dto/ws-add-subtask.dto';
import { IssueResponseDto } from './dto/issue-response.dto';
import { mapIssueToResponse } from './issue.mapper';
import { IssueStatus } from './constants/issue-status.enum';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(IssueComment)
    private readonly issueCommentRepository: Repository<IssueComment>,

  ) {}

  /** 이슈 생성 */
  async createIssue(projectId: string, createIssueDto: CreateIssueDto, creator: User): Promise<IssueResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }

    const parent = createIssueDto.parentId ? await this.issueRepository.findOne({ where: { id: createIssueDto.parentId } }) : null;
    if (createIssueDto.parentId && !parent) {
      throw new NotFoundException('상위 업무 없음');
    }

    const assignee = createIssueDto.assigneeId ? await this.userRepository.findOne({ where: { id: createIssueDto.assigneeId } }) : null;
    
    const issue = this.issueRepository.create({
      ...createIssueDto,
      project,
      creator,
      parent,
      assignee,
    });

    const saved = await this.issueRepository.save(issue);
    return mapIssueToResponse(saved);
  }

  /** 이슈 수정 */
  async updateIssue(issueId: string, updateIssueDto: UpdateIssueDto) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId }, relations: ['assignee', 'subtasks'] });
    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    if (updateIssueDto.assigneeId) {
      const assignee = await this.userRepository.findOne({ where: { id: updateIssueDto.assigneeId } });
      if (!assignee) {
        throw new NotFoundException('사용자 없음');
      }
      issue.assignee = assignee;
    }

    const saved = await this.issueRepository.save(issue);
    return mapIssueToResponse(saved);
  }

  /** 담당자 지정 */
  async assignIssue(issueId: string, userId: string) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    const user = await this.userRepository.findOne({ where: { id: userId }});
    if (!user) {
      throw new NotFoundException('사용자 없음');
    }

    issue.assignee = user;
    const saved = await this.issueRepository.save(issue);
    return mapIssueToResponse(saved);
  }

  /** 프로젝트 내 모든 이슈 조회 */
  async getProjectIssues(projectId: string): Promise<IssueResponseDto[]> {
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

    return issues.map(mapIssueToResponse);
  }

  /** 하위 업무 추가 */
  async addSubtask(wsAddSubtaskDto: WsAddSubtaskDto) {
    const parent = await this.issueRepository.findOne({
      where: { id: wsAddSubtaskDto.parentId },
      relations: ['subtasks']
    });
    if (!parent) {
      throw new NotFoundException('상위 업무 없음');
    }

    const assignee = wsAddSubtaskDto.assigneeId ? { id: wsAddSubtaskDto.assigneeId } : null;
    const subtask = this.issueRepository.create({
      title: wsAddSubtaskDto.title,
      parent,
      assignee,
      startAt: wsAddSubtaskDto.startAt,
      endAt: wsAddSubtaskDto.dueAt,
    });

    await this.issueRepository.save(subtask);

    // 부모 진행률 재계산
    await this.recalculateParentProgress(parent);

    return subtask;
  }

  /** 하위 업무 삭제 */
  async removeSubtask(subtaskId: string) {
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
  async updateProgress(issueId: string, data: { progress: number }) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['subtasks', 'parent']
    });
    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    issue.progress = data.progress;
    await this.issueRepository.save(issue);

    // 상위 업무 진행률 자동 재계산
    if (issue.parent) {
      await this.recalculateParentProgress(issue.parent);
    }

    return issue;
  }

  /** 상태 업데이트 */
  async updateStatus(issueId: string, status: IssueStatus) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    issue.status = status;
    return this.issueRepository.save(issue);
  }

  /** 상위 업무 진행률 재계산 */
  async recalculateParentProgress(parent: Issue) {
    const subtasks = await this.issueRepository.find({ where: { parent: { id: parent.id } } });
    if (!subtasks.length) return;

    const avgProgress = Math.floor(subtasks.reduce((sum, s) => sum + s.progress, 0) / subtasks.length);
    parent.progress = avgProgress;
    await this.issueRepository.save(parent);

    // 재귀적으로 상위 업무까지 반영
    if (parent.parent) {
      await this.recalculateParentProgress(parent.parent);
    }
  }

  /** 커멘트 추가 */
  async addComment(issueId: string, user: User, content: string) {
    const issue = await this.issueRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException('이슈 없음');
    }

    const comment = this.issueCommentRepository.create({ issue, author: user, content });
    return this.issueCommentRepository.save(comment);
  }
}