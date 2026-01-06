// src/modules/chat/dto/chatroom-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { ChatRoomTargetUserDto } from "./chat-room-target-user.dto";

export class ChatRoomResponseDto {
  @ApiProperty({ description: '채팅방 ID' })
  roomId: string;

  @ApiProperty({
    example: {
      id: '5f3a1c2b-7d89-4e10-8234-abcdef123456',
      name: 'tester',
      email: 'test@test.com',
    },
    description: '대화 상대 사용자 정보',
  })
  targetUser: ChatRoomTargetUserDto;
  
  @ApiProperty({ nullable: true, description: '채팅방의 마지막 메시지 내용 (없으면 null)' })
  lastMessage: string | null;

  @ApiProperty({ nullable: true, description: '마지막 메시지 시각 (없으면 null)' })
  lastMessageAt: Date | null;

  @ApiProperty({ example: 3, description: '읽지 않은 에시지 개수'})
  unreadCount: number;
}