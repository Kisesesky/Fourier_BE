// src/modules/chat/dto/unread-count.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountDto {
  @ApiProperty()
  id: string;
}