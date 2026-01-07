// src/modules/chat/dto/ws-delete-channel-message.dto.ts
import { IsUUID } from 'class-validator';

export class WsDeleteChannelMessageDto {
  @IsUUID()
  messageId: string;
}