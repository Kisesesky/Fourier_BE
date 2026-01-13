import { ApiProperty } from "@nestjs/swagger";

// src/modules/chat/dto/send-thread-message.dto.ts
export class SendThreadMessageDto {
  @ApiProperty({ example: 'parent-message-uuid' })
  parentMessageId: string;
  
  @ApiProperty({ example: '' })
  content?: string;

  @ApiProperty({ example: '' })
  fileIds?: string[];
}