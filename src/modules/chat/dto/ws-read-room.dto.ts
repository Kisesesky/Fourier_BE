// src/modules/chat/dto/ws-read-room.dto.ts
import { IsUUID } from 'class-validator';

export class WsReadRoomDto {
  @IsUUID()
  roomId: string;
}