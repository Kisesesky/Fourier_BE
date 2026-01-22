// src/modules/activity-log/dto/activity-feed-item.dto.ts
import { ActivityTargetType } from '../constants/activity-target-type.enum';

export class ActivityFeedItemDto {
  id: string;

  actor: {
    id: string;
    name: string;
  } | null;

  action: string;
  targetType: ActivityTargetType;
  targetId: string;

  projectId?: string;

  message: string;
  payload?: any;

  createdAt: Date;
}