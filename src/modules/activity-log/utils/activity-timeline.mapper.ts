// src/modules/activity-log/utils/activity-timeline.mapper.ts
import { ActivityLog } from '../entities/activity-log.entity';
import { ActivityTimelineItemDto } from '../dto/activity-timeline-item.dto';
import { buildActivityMessage } from './activity-message.util';

export function mapActivityLogToTimeline(
  activityLog: ActivityLog,
): ActivityTimelineItemDto {
  return {
    id: activityLog.id,
    actorName: activityLog.actor
      ? activityLog.actor.displayName ?? activityLog.actor.name
      : null,
    action: activityLog.action,
    targetType: activityLog.targetType,
    targetId: activityLog.targetId,
    message: buildActivityMessage(activityLog),
    payload: activityLog.payload,
    createdAt: activityLog.createdAt,
  };
}