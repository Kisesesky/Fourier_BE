// src/modules/activity-log/dto/get-team-activity.query.dto.ts
import { IsOptional, IsUUID, IsEnum, IsNumberString } from 'class-validator';
import { ActivityTargetType } from '../constants/activity-target-type.enum';

export class GetTeamActivityQueryDto {
  @IsOptional()
  cursor?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsEnum(ActivityTargetType)
  targetType?: ActivityTargetType;
}