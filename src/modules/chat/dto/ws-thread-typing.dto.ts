// src/modules/chat/dto/ws-thread-typing.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsUUID } from "class-validator";

export class WsThreadTypingDto {
  @ApiProperty({ example: 'dm-room-uuid' })
  @IsUUID()
  parentMessageId: string;

  @IsBoolean()
  isTyping: boolean;
}