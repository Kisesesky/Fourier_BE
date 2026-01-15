// src/modules/chat/dto/read-dm-message.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ReadDmMessageDto {
  @ApiProperty({ example: 'dm-room-uuid' })
  roomId: string;
}