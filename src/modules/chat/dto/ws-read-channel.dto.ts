// ws-read-channel.dto.ts
import { IsUUID, IsISO8601 } from 'class-validator';

export class WsReadChannelDto {
  @IsUUID()
  channelId: string;

  @IsISO8601()
  lastReadAt: string; // ISO string
}