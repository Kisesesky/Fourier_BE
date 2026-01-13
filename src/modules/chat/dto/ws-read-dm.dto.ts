// src/modules/chat/dto/ws-read-dm.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class WsReadDMDto {
  @ApiProperty({ example: 'message-uuid', required: false })
  @IsUUID()
  messageId: string;
}
