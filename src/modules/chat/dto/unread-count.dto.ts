// src/modules/chat/dto/unread-count.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountDto {
  @ApiProperty({ example: 'channel-or-dm-id' })
  id: string;
}