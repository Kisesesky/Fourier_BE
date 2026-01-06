// src/modules/chat/dto/ws-send-message.dto.ts
import { IsUUID, IsString, MinLength } from 'class-validator';

export class WsSendMessageDto {
  @IsUUID()
  roomId: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsString()
  tempId: string;
}