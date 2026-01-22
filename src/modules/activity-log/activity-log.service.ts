// src/modules/activity-log/activity-log.service.ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { User } from '../users/entities/user.entity';
import { mapActivityLogToFeedItem } from './utils/activity-feed.mapper';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { ActivityGateway } from './gateways/activity.gateway';
import { GetTeamActivityQueryDto } from './dto/get-team-activity-query.dto';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    private readonly activityGateway: ActivityGateway,
  ) {}

  /** 기록 + 실시간 push */
  async log(
    createActivityLogDto: CreateActivityLogDto,
  ) {
    const log = await this.activityLogRepository.save(this.activityLogRepository.create(createActivityLogDto));

    const actor = createActivityLogDto.actorId
      ? await this.usersRepository.findOneBy({ id: createActivityLogDto.actorId })
      : undefined;

    this.activityGateway.emitTeamActivity(
      log.teamId,
      mapActivityLogToFeedItem(log, actor),
    );

    return log;
  }

  /** 프로젝트 피드 */
  async getProjectFeed(
    projectId: string,
    user: User,
  ) {
    const isMember = await this.projectMemberRepo.exists({
      where: { project: { id: projectId }, user: { id: user.id } },
    });

    if (!isMember) throw new ForbiddenException();

    const logs = await this.activityLogRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return this.enrich(logs);
  }

  /** 팀 피드 (cursor 기반) */
  async getTeamFeed(
    teamId: string,
    user: User,
    query: GetTeamActivityQueryDto,
  ) {
    const isMember = await this.teamMemberRepository.exists({
      where: { team: { id: teamId }, user: { id: user.id } },
    });

    if (!isMember) throw new ForbiddenException();

    const limit = Math.min(Number(query.limit ?? 30), 50);

    const qb = this.activityLogRepository
      .createQueryBuilder('log')
      .where('log.teamId = :teamId', { teamId })
      .orderBy('log.createdAt', 'DESC')
      .take(limit + 1);

    if (query.projectId) {
      qb.andWhere('log.projectId = :projectId', {
        projectId: query.projectId,
      });
    }

    if (query.targetType) {
      qb.andWhere('log.targetType = :targetType', {
        targetType: query.targetType,
      });
    }

    if (query.cursor) {
      qb.andWhere('log.createdAt < :cursor', {
        cursor: new Date(query.cursor),
      });
    }

    const logs = await qb.getMany();
    const items = await this.enrich(logs.slice(0, limit));

    return {
      items,
      nextCursor:
        logs.length > limit
          ? items[items.length - 1].createdAt
          : null,
    };
  }

  private async enrich(
    logs: ActivityLog[],
  ) {
    const actorIds = [...new Set(logs.map(l => l.actorId).filter(Boolean))];
    const users = await this.usersRepository.findBy({ id: In(actorIds) });
    const map = new Map(users.map(u => [u.id, u]));

    return logs.map(log =>
      mapActivityLogToFeedItem(log, map.get(log.actorId ?? '')),
    );
  }
}