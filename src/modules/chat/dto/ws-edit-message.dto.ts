// src/moudles/chat/dto/ws-edit-message.dto.ts
import { IsString, IsUUID } from "class-validator";

export class WsEditMessageDto {
  @IsUUID()
  messageId: string;

  @IsString()
  content: string;
}