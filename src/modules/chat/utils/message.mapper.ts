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
    threadUnreadCount?: number;
    pinnedMessageIds?: Set<string>;
    savedMessageIds?: Set<string>;
  },
): MessageResponseDto {
  const isDeleted = message.isDeleted === true;

  return {
    id: message.id,
    type: isDeleted ? MessageType.SYSTEM : message.type,
    content: isDeleted ? '삭제된 메시지입니다.' : message.content ?? undefined,
    senderId: message.senderId,
    sender: {
      id: message.senderId,
      name: message.senderName,
      avatar: message.senderAvatar,
    },
    reply: buildReply(message),
    threadParentId: message.threadParent?.id,
    thread: buildThreadMeta(message, options),
    createdAt: message.createdAt,
    editedAt: message.editedAt ?? undefined,
    isDeleted,
    files: isDeleted ? [] : mapFiles(message),
    reactions: isDeleted ? [] : buildReactionDto(message.reactions ?? [], currentUserId),
    isPinned: options?.pinnedMessageIds?.has(message.id) ?? false,
    isSaved: options?.savedMessageIds?.has(message.id) ?? false,
    linkPreview: message.linkPreview
      ? {
          url: message.linkPreview.url,
          title: message.linkPreview.title,
          description: message.linkPreview.description,
          imageUrl: message.linkPreview.imageUrl,
          siteName: message.linkPreview.siteName,
        }
      : undefined,
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

function buildReply(
  message: ChannelMessage | DmMessage,
) {
  if (!message.replyTo) return undefined;

  const r = message.replyTo;

  return {
    id: r.id,
    content: r.isDeleted ? '삭제된 메시지입니다.' : r.content ?? undefined,
    sender: {
      id: r.senderId,
      name: r.senderName,
      avatar: r.senderAvatar,
    },
    isDeleted: r.isDeleted,
  };
}

function mapFiles(message: ChannelMessage | DmMessage): MessageFileDto[] {
  return (message.files ?? []).map(mf => ({
    id: mf.file.id,
    fileUrl: mf.file.fileUrl,
    fileName: mf.file.fileName,
    mimeType: mf.file.mimeType,
    fileSize: mf.file.fileSize,
    thumbnailUrl: mf.file.thumbnailUrl,
  }));
}

function isChannelMessage(
  message: ChannelMessage | DmMessage,
): message is ChannelMessage {
  return (message as ChannelMessage).channel !== undefined;
}

function buildThreadMeta(
  message: ChannelMessage | DmMessage,
  options?: { threadUnreadCount?: number },
): MessageThreadDto | undefined {
  if (!isChannelMessage(message)) return undefined;
  if (message.threadParent) return undefined;
  if (!message.threadCount) return undefined;

  return {
    count: message.threadCount,
    unreadCount: options?.threadUnreadCount ?? 0,
    lastMessageAt: message.lastThreadAt ?? undefined,
  };
}