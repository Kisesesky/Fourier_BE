// src/modules/chat/utils/message.mapper.ts
import { MessageType } from '../constants/message-type.enum';
import { MessageResponseDto, MessageFileDto, MessageReactionDto, MessageThreadDto } from '../dto/message-response.dto';
import { ChannelMessage } from '../entities/channel-message.entity';
import { DmMessage } from '../entities/dm-message.entity';
import { MessageReaction } from '../entities/message-reaction.entity';

export function mapMessageToResponse(
  message: ChannelMessage | DmMessage,
  currentUserId: string,
  options?: {
    threadUnreadCount?: number,
    lastReplyAt?: Date,
  }
): MessageResponseDto {
  const isDeleted = message.isDeleted === true;

  return {
    id: message.id,
    type: isDeleted ? MessageType.SYSTEM : message.type,
    content: isDeleted ? '삭제된 메시지입니다.' : message.content ?? undefined,
    senderId: message.sender.id,
    parentMessageId: message.parentMessage?.id,
    replyCount: message.replyCount ?? 0,
    createdAt: message.createdAt,
    editedAt: message.editedAt ?? undefined,
    isDeleted,
    files: isDeleted
      ? []
      : (message.files ?? []).map((messagefile): MessageFileDto => ({
          id: messagefile.file.id,
          fileUrl: messagefile.file.fileUrl,
          fileName: messagefile.file.fileName,
          mimeType: messagefile.file.mimeType,
          fileSize: messagefile.file.fileSize,
          thumbnailUrl: messagefile.file.thumbnailUrl,
        })),
    reactions: isDeleted
      ? []
      : buildReactionDto(message.reactions ?? [], currentUserId),
    thread: buildThreadMeta(message, options),
  };
}

function buildReactionDto(
  reactions: MessageReaction[],
  currentUserId: string,
): MessageReactionDto[] {
  const map = new Map<string, { count: number; reactedByMe: boolean }>();

  for (const reaction of reactions) {
    const key = reaction.emoji;
    const entry = map.get(key) ?? { count: 0, reactedByMe: false };

    entry.count += 1;
    if (reaction.user.id === currentUserId) {
      entry.reactedByMe = true;
    }

    map.set(key, entry);
  }

  return Array.from(map.entries()).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    reactedByMe: data.reactedByMe,
  }));
}

function buildThreadMeta(
  message: ChannelMessage | DmMessage,
  options?: { threadUnreadCount?: number },
): MessageThreadDto | undefined {
  // 스레드 답장에는 thread 정보 없음
  if (message.parentMessage) return undefined;

  // DM은 thread 없음 (정책)
  if (message instanceof DmMessage) return undefined;

  if (!message.replyCount || message.replyCount === 0) {
    return undefined;
  }

  return {
    replyCount: message.replyCount,
    unreadCount: options?.threadUnreadCount ?? 0,
    lastReplyAt: message.lastReplyAt ?? undefined,
  };
}