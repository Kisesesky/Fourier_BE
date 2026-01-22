// src/modules/activity-log/utils/activity-feed.mapper.ts
import { ActivityLog } from '../entities/activity-log.entity';
import { ActivityFeedItemDto } from '../dto/activity-feed-item.dto';
import { User } from '../../users/entities/user.entity';
import { buildActivityMessage } from './activity-message.util';

export function mapActivityLogToFeedItem(
  log: ActivityLog,
  actor?: User,
): ActivityFeedItemDto {
  return {
    id: log.id,
    actor: actor
      ? { id: actor.id, name: actor.displayName ?? actor.name }
      : null,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    projectId: log.projectId,
    message: buildActivityMessage(log, actor),
    payload: log.payload,
    createdAt: log.createdAt,
  };
}