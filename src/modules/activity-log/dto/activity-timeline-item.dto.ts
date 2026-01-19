// src/modules/activity-log/dto/activity-timeline-item.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ActivityTimelineItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '홍길동' })
  actorName: string | null;

  @ApiProperty({ example: 'issue.updated' })
  action: string;

  @ApiProperty({ example: 'ISSUE' })
  targetType: string;

  @ApiProperty({ example: 'target-uuid' })
  targetId: string;

  @ApiProperty({ example: '홍길동이 이슈를 수정했습니다.' })
  message: string;

  @ApiProperty({ required: false })
  payload?: any;

  @ApiProperty()
  createdAt: Date;
}