// src/modules/activity-log/activity-log.service.ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { User } from '../users/entities/user.entity';
import { mapActivityLogToTimeline } from './utils/activity-timeline.mapper';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  async log(createActivityLogDto: CreateActivityLogDto) {
    const log = this.activityLogRepository.create(createActivityLogDto);
    return this.activityLogRepository.save(log);
  }

  async getProjectTimeline(
    projectId: string,
    user: User,
  ) {
    const isMember = await this.projectMemberRepository.exists({
      where: {
        project: { id: projectId },
        user: { id: user.id },
      },
    });

    if (!isMember) {
      throw new ForbiddenException('프로젝트 접근 권한이 없습니다.');
    }

    const logs = await this.activityLogRepository.find({
      where: { project: { id: projectId } },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: 100, // 🔥 실무 필수
    });

    return logs.map(mapActivityLogToTimeline);
  }
}