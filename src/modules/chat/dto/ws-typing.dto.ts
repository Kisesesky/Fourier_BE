// src/modules/chat/dto/ws-typing.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsBoolean } from 'class-validator';

export class WsTypingDto {
  @ApiProperty({ example: 'dm-room-uuid' })
  @IsUUID()
  roomId: string;

  @IsBoolean()
  typing: boolean;
}