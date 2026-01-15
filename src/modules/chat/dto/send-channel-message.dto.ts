// src/modules/chat/dto/send-channel-message.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class SendChannelMessageDto {
  @ApiProperty({ example: 'channel-uuid' })
  @IsUUID()
  channelId: string;

  @ApiProperty({ example: '안녕하세요 👋' })
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'FilesService에서 업로드 후 받은 fileId 배열', example: ['file-uuid-1', 'file-uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  fileIds?: string[];

  @ApiProperty({ example: 'reply-message-uuid', required: false })
  @IsOptional()
  @IsUUID()
  replyToMessageId?: string;

  @ApiPropertyOptional({ example: 'parent-message-uuid', required: false })
  @IsOptional()
  @IsUUID()
  threadParentId?: string;
}