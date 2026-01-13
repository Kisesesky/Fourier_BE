// src/modules/chat/dto/ws-read-message.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class WsReadMessageDto {
  @ApiProperty({ example: 'message-uuid', required: false })
  @IsUUID()
  messageId: string;
}