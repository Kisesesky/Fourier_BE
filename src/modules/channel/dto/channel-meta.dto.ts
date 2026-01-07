// channel-meta.dto.ts
export class ChannelMetaDto {
  channelId: string;
  name: string;
  isPrivate: boolean;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: Date | null;
}