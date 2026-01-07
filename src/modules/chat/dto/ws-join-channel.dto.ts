// src/modules/chat/dto/ws-join-channel.dto.ts
import { IsUUID } from 'class-validator';

export class WsJoinChannelDto {
  @IsUUID()
  channelId: string;
}