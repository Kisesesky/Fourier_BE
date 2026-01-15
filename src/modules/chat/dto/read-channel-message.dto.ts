// src/modules/chat/dto/read-channel-message.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ReadChannelMessageDto {
  @ApiProperty({ example: 'channel-uuid' })
  channelId: string;
}