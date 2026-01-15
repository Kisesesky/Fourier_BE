// src/modules/chat/dto/ws-thread-typing.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsUUID } from "class-validator";

export class WsThreadTypingDto {
  @ApiProperty({ example: 'thread-parent-message-uuid' })
  @IsUUID()
  threadParentId: string;

  @IsBoolean()
  isTyping: boolean;
}