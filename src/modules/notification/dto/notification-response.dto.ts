// src/modules/notification/dto/notification-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../constants/notification-type.enum';

export class NotificationResponseDto {
  @ApiProperty({ example: '8c2d7f1a-7c9b-4c3a-bd2e-123456789abc' })
  id: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.INVITE })
  type: NotificationType;

  @ApiProperty({ example: false, description: '읽음 여부' })
  read: boolean;

  @ApiProperty({ example: '2026-01-12T10:21:00.000Z' })
  createdAt: Date;

  @ApiProperty({
    description: '알림 타입별 payload',
    example: {
      teamId: 'team-uuid',
      teamName: 'Frontend Team',
      inviterName: 'Sungho',
      inviteId: 'invite-uuid',
    },
  })
  payload: any;
}