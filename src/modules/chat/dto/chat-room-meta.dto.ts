// src/modules/chat/dto/chat-room-meta.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class ChatRoomMetaDto {
  @ApiProperty({ description: '채팅방 ID' })
  roomId: string;

  @ApiProperty({ description: '1:1 채팅방의 첫 번째 사용자 ID' })
  userAId: string;

  @ApiProperty({ description: '1:1 채팅방의 두 번째 사용자 ID' })
  userBId: string;
  
  @ApiProperty({ nullable: true, description: '채팅방의 마지막 메시지 시각 (없으면 null)' })
  lastMessageAt: Date | null;
}