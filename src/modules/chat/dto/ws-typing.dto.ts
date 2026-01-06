// src/modules/chat/dto/ws-typing.dto.ts
import { IsUUID } from 'class-validator';

export class WsTypingDto {
  @IsUUID()
  roomId: string;
}