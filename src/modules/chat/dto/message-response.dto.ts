// src/modules/chat/dto/message-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class MessageResponseDto {
  @ApiProperty({ description: '메시지 ID' })
  id: string;

  @ApiProperty({ example: '안녕하세요?', description: '메시지 내용' })
  content: string;

  @ApiProperty({ description: '메시지를 보낸 사용자 ID' })
  senderId: string;

  @ApiProperty({ description: '메세지 생성 시각' })
  createdAt: Date;

  @ApiProperty({ example: false, description: '메시지 읽음 여부' })
  isRead: boolean;
}
