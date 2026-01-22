// src/modules/mention/mention.service.
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { MentionTargetType } from './constants/mention-target-type.enum';
import { parseMentions } from './utils/mention-parser.util';
import { Mention } from './entities/mention.entity';
import { NotificationGateway } from '../notification/notification.gateway';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityTargetType } from '../activity-log/constants/activity-target-type.enum';
import { ActivityAction } from '../activity-log/constants/activity-action.enum';
import { Issue } from '../issues/entities/issue.entity';

@Injectable()
export class MentionService {
  constructor(
    @InjectRepository(Mention)
    private readonly mentionRepository: Repository<Mention>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    private readonly notificationGateway: NotificationGateway,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async getPreview(type: MentionTargetType, id: string) {
    switch (type) {
      case MentionTargetType.USER:
        return this.getUserPreview(id);

      case MentionTargetType.ISSUE:
        return this.getIssuePreview(id);

      default:
        throw new NotFoundException('지원하지 않는 멘션 타입입니다.');
    }
  }

  private async getUserPreview(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('유저 없음');

    return {
      type: 'USER',
      title: user.displayName ?? user.name,
      subtitle: user.email ?? null,
      avatar: user.avatarUrl ?? null,
    };
  }

  private async getIssuePreview(issueId: string) {
    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
      relations: ['assignee'],
    });

    if (!issue) throw new NotFoundException('이슈 없음');

    return {
      type: 'ISSUE',
      title: issue.title,
      status: issue.status,
      progress: issue.progress,
      assignee: issue.assignee
        ? {
            id: issue.assignee.id,
            name: issue.assignee.displayName ?? issue.assignee.name,
          }
        : null,
    };
  }

  async handleMentions({
    content,
    actor,
    teamId,
    projectId,
    targetId,
  }: {
    content: string;
    actor: User;
    teamId: string;
    projectId?: string;
    targetId: string;
  }) {
    const mentions = parseMentions(content);

    for (const mention of mentions) {
      if (mention.type === MentionTargetType.USER && mention.id) {
        await this.createMention(mention.id, actor, teamId, projectId, targetId);
      }

      if (
        mention.type === MentionTargetType.TEAM ||
        mention.type === MentionTargetType.EVERYONE
      ) {
        await this.mentionTeam(actor, teamId, projectId, targetId);
      }
    }
  }

  private async createMention(
    userId: string,
    actor: User,
    teamId: string,
    projectId?: string,
    targetId?: string,
  ) {
    await this.mentionRepository.upsert(
      {
        mentionedUserId: userId,
        actorId: actor.id,
        type: MentionTargetType.USER,
        teamId,
        projectId,
        targetId,
      },
      ['mentionedUserId', 'targetId'],
    );

    this.notificationGateway.emitUser(userId, {
      type: 'MENTION',
      actor: actor.displayName ?? actor.name,
      targetId,
    });

    await this.activityLogService.log({
      actorId: actor.id,
      teamId,
      projectId,
      targetType: ActivityTargetType.USER,
      targetId: userId,
      action: ActivityAction.MENTION_USER,
      payload: {
        meta: {
          sourceTargetId: targetId
        },
      },
    });
  }

  private async mentionTeam(
    actor: User,
    teamId: string,
    projectId?: string,
    targetId?: string,
  ) {
    const members = await this.teamMemberRepository.find({
      where: { team: { id: teamId } },
      relations: ['user'],
    });

    for (const m of members) {
      if (m.user.id === actor.id) continue;

      await this.createMention(
        m.user.id,
        actor,
        teamId,
        projectId,
        targetId,
      );
    }

    await this.activityLogService.log({
      actorId: actor.id,
      teamId,
      projectId,
      targetType: ActivityTargetType.TEAM,
      targetId: teamId,
      action: ActivityAction.MENTION_TEAM,
      payload: {
        meta: {
          sourceTargetId: targetId
        },
      },
    });
  }

  async markAsRead(mentionId: string, user: User) {
    await this.mentionRepository.update(
      { id: mentionId, mentionedUserId: user.id },
      { isRead: true },
    );
  }

  async getMyMentions(user: User) {
    return this.mentionRepository.find({
      where: { mentionedUserId: user.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}