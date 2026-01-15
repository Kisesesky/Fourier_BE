// src/modules/chat/dto/ws-read-message.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class WsReadChannelDto {
  @ApiProperty({ example: 'message-uuid', required: false })
  @IsUUID()
  messageId: string;
}