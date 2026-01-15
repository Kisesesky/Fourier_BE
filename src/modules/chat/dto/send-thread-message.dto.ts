import { ApiProperty } from "@nestjs/swagger";

// src/modules/chat/dto/send-thread-message.dto.ts
export class SendThreadMessageDto {
  @ApiProperty({ example: 'thread-parent-message-uuid' })
  threadParentId: string;
  
  @ApiProperty({ example: '스레드 메시지 내용', required: false })
  content?: string;

  @ApiProperty({ example: ['file-uuid'], required: false, type: [String] })
  fileIds?: string[];
}