import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";

// src/modules/chat/dto/send-thread-message.dto.ts
export class SendThreadMessageDto {
  @ApiProperty({ example: 'thread-parent-message-uuid' })
  @IsUUID()
  threadParentId: string;
  
  @ApiProperty({ example: '스레드 메시지 내용', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: ['file-uuid'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];
}
