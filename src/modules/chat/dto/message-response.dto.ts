// src/modules/chat/dto/message-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../constants/message-type.enum';

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
  @ApiProperty({ example: 3 })
  count: number;

  @ApiProperty({ example: 1 })
  unreadCount: number;

  @ApiProperty({ example: '2026-01-01T12:00:00.000Z' })
  lastMessageAt?: Date;
}

export class ReplyDto {
  @ApiProperty({ example: '' })
  id: string;

  @ApiProperty({ example: '' })
  content?: string;

  @ApiProperty({ example: '' })
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };

  @ApiProperty({ example: '' })
  isDeleted: boolean;
}

export class LinkPreviewDto {
  @ApiProperty()
  url: string;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  imageUrl?: string;

  @ApiProperty({ required: false })
  siteName?: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'message-uuid' })
  id: string;

  @ApiProperty({ enum: MessageType })
  type: MessageType;

  @ApiProperty({ example: '안녕하세요', required: false })
  content?: string;

  @ApiProperty({ example: 'user-uuid' })
  senderId: string;

  @ApiProperty({ example: '' })
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };

  @ApiProperty({ type: ReplyDto, required: false })
  reply?: ReplyDto;

  @ApiProperty({ required: false })
  threadParentId?: string;

  @ApiProperty({ type: MessageThreadDto, required: false })
  thread?: MessageThreadDto;

  @ApiProperty({ example: '2025-01-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T12:00:00.000Z', required: false })
  editedAt: Date;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: false })
  isPinned?: boolean;

  @ApiProperty({ example: false })
  isSaved?: boolean;

  @ApiProperty({ type: [MessageFileDto] })
  files?: MessageFileDto[];

  @ApiProperty({ type: [MessageReactionDto] })
  reactions?: MessageReactionDto[];

  @ApiProperty({ type: LinkPreviewDto, required: false })
  linkPreview?: LinkPreviewDto;
}