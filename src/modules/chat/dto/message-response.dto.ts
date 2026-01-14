// src/modules/chat/dto/message-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../constants/message-type.enum';
import { LinkPreviewDto } from './link-preview.dto';

export class MessageFileDto {
  @ApiProperty({ example: 'file-uuid' })
  id: string;

  @ApiProperty({ example: 'www.....' })
  fileUrl: string;

  @ApiProperty({ example: 'filename' })
  fileName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty({ example: '1111' })
  fileSize: number;

  @ApiProperty({ required: false })
  thumbnailUrl?: string;
}

export class MessageReactionDto {
  @ApiProperty({ example: ':saluting_face:' })
  emoji: string;

  @ApiProperty({ example: '1' })
  count: number;

  @ApiProperty()
  reactedByMe: boolean;
}

export class MessageThreadDto {
  @ApiProperty({ example: '1' })
  replyCount: number;

  @ApiProperty({ example: '1' })
  unreadCount: number;

  @ApiProperty({ example: '2026....' })
  lastReplyAt?: Date;
}

export class ReplyDto {
  @ApiProperty({ example: '' })
  id: string;

  @ApiProperty({ example: '' })
  content?: string;

  @ApiProperty({ example: '' })
  sender: {
    id: string;
    nickname: string;
  };

  @ApiProperty({ example: '' })
  isDeleted: boolean;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'message-uuid' })
  id: string;

  @ApiProperty({ enum: MessageType })
  type: MessageType;

  @ApiProperty({ example: '안녕하세요', required: false })
  content?: string;

  @ApiProperty({ type: [MessageFileDto] })
  files?: MessageFileDto[];

  @ApiProperty({ example: 'user-uuid' })
  senderId: string;

  @ApiProperty({ required: false })
  parentMessageId?: string;

  @ApiProperty({ example: 3 })
  replyCount: number;

  @ApiProperty({ type: [MessageReactionDto] })
  reactions?: MessageReactionDto[];

  @ApiProperty({ type: MessageThreadDto, required: false })
  thread?: MessageThreadDto;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: '2025-01-01T12:00:00.000Z', required: false })
  editedAt?: Date;

  @ApiProperty({ example: false })
  isPinned?: boolean;

  @ApiProperty({ example: false })
  isSaved?: boolean;

  @ApiProperty({ type: ReplyDto, required: false })
  reply?: ReplyDto;

  @ApiProperty({ example: '2025-01-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: LinkPreviewDto, required: false })
  linkPreview?: LinkPreviewDto;
}