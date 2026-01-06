// src/modules/chat/dto/ws-join-room.dto.ts
import { IsUUID } from 'class-validator';

export class WsJoinRoomDto {
  @IsUUID()
  roomId: string;
}