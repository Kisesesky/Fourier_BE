// src/modules/activity-log/dto/create-activity-log.dto.ts
import { ActivityTargetType } from "../constants/activity-target-type.enum";

export class CreateActivityLogDto {
  actorId?: string;

  projectId: string;
  teamId: string;

  targetType: ActivityTargetType;
  targetId: string;

  action: string;

  payload?: {
    before?: any;
    after?: any;
    meta?: any;
  };
}