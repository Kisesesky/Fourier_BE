// src/modules/chat/dto/send-channel-message.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MessageType } from '../constants/message-type.enum';

export class SendChannelMessageDto {
  @ApiProperty({ example: 'channel-uuid' })
  @IsUUID()
  channelId: string;

  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ example: '안녕하세요 👋' })
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'parent-message-uuid' })
  @IsOptional()
  @IsUUID()
  parentMessageId?: string;

  @ApiPropertyOptional({ description: 'FilesService에서 업로드 후 받은 fileId 배열', example: ['file-uuid-1', 'file-uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  fileIds?: string[];
}