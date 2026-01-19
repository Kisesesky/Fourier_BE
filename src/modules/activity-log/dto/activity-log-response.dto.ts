// src/modules/activity-log/dto/activity-log-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ActivityLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '홍길동' })
  actorName: string | null;

  @ApiProperty({ example: 'issue.updated' })
  action: string;

  @ApiProperty({ example: 'issue' })
  targetType: string;

  @ApiProperty({ example: 'target-uuid' })
  targetId: string;

  @ApiProperty({ example: '홍길동이 이슈를 수정했습니다.' })
  summary: string;

  @ApiProperty()
  payload?: any;

  @ApiProperty()
  createdAt: Date;
}