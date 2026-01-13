// src/modules/chat/dto/toggle-reaction.dto.ts
import { IsUUID, IsString } from 'class-validator';

export class ToggleReactionDto {
  @IsUUID()
  messageId: string;

  @IsString()
  emoji: string;
}