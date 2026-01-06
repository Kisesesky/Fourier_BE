// src/modules/chat/dto/ws-delete-message.dto.ts
import { IsUUID } from 'class-validator';

export class WsDeleteMessageDto {
  @IsUUID()
  messageId: string;
}