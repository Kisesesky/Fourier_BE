// src/modules/notification/dto/invite-notification-payload.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class InviteNotificationPayloadDto {
  @ApiProperty({ example: 'team-uuid' })
  teamId: string;

  @ApiProperty({ example: 'Frontend Team' })
  teamName: string;

  @ApiProperty({ example: '김철수' })
  inviterName: string;

  @ApiProperty({ example: 'invite-uuid' })
  inviteId: string;
}