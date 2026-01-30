// src/modules/chat/chat.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsSendDMDto } from '../dto/ws-send-dm.dto';
import { WsReadDMDto } from '../dto/ws-read-dm.dto';
import { WsTypingDto } from '../dto/ws-typing.dto';
import { ChatService } from '../chat.service';
import { SendChannelMessageDto } from '../dto/send-channel-message.dto';
import { mapMessageToResponse } from '../utils/message.mapper';
import { WsEditMessageDto } from '../dto/ws-edit-message.dto';
import { WsDeleteMessageDto } from '../dto/ws-delete-message.dto';
import { ToggleReactionDto } from '../dto/toggle-reaction.dto';
import { SendThreadMessageDto } from '../dto/send-thread-message.dto';
import { ChannelMessage } from '../entities/channel-message.entity';
import { DmMessage } from '../entities/dm-message.entity';
import { ForbiddenException, forwardRef, Inject } from '@nestjs/common';
import { ScopedMessage } from '../types/message-scope.type';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private onlineUsers = new Map<string, string>();
  private threadViewers = new Map<string, Set<string>>();
  private userStatus = new Map<string, 'online' | 'offline' | 'away' | 'dnd'>();

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService
  ) {}

  private resolveMessageRoom(
    scoped: ScopedMessage<ChannelMessage | DmMessage>,
  ): string {
    return scoped.scope === 'CHANNEL'
      ? `channel:${(scoped.message as ChannelMessage).channel.id}`
      : (scoped.message as DmMessage).room.id;
  }

  private emitMessageEvent(
    room: string,
    type:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'reaction'
    | 'thread_created'
    | 'thread_meta',
    payload: any,
  ) {
    this.server.to(room).emit('message.event', {
      type,
      roomId: room,
      payload,
    });
  }

  emitChannelMessageCreated(channelId: string, payload: any) {
    this.emitMessageEvent(`channel:${channelId}`, 'created', payload);
  }

  emitChannelMessageUpdated(channelId: string, payload: any) {
    this.emitMessageEvent(`channel:${channelId}`, 'updated', payload);
  }

  emitChannelMessageDeleted(channelId: string, messageId: string) {
    this.emitMessageEvent(`channel:${channelId}`, 'deleted', { messageId });
  }

  emitChannelReaction(channelId: string, payload: { messageId: string; emoji: string; userId: string; action: string }) {
    this.emitMessageEvent(`channel:${channelId}`, 'reaction', payload);
  }

  emitThreadCreated(channelId: string, payload: any) {
    this.emitMessageEvent(`channel:${channelId}`, 'thread_created', payload);
  }

  emitThreadMeta(channelId: string, payload: any) {
    this.emitMessageEvent(`channel:${channelId}`, 'thread_meta', payload);
  }

  getOnlineUserIds() {
    return Array.from(this.onlineUsers.keys());
  }

  getPresenceSnapshot() {
    const statuses: Record<string, 'online' | 'offline' | 'away' | 'dnd'> = {};
    for (const [userId, status] of this.userStatus.entries()) {
      statuses[userId] = status;
    }
    return { onlineUserIds: this.getOnlineUserIds(), statuses };
  }

  setUserPresence(userId: string, status: 'online' | 'offline' | 'away' | 'dnd') {
    this.userStatus.set(userId, status);
    this.server.emit('presence.update', {
      userId,
      status,
      onlineUserIds: this.getOnlineUserIds(),
    });
  }

  /** 클라이언트 연결 */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        return client.disconnect();
      }

      const user = await this.chatService.verifyToken(token);
      if (!user) {
        return client.disconnect();
      }

      // 온라인 상태 등록
      this.onlineUsers.set(user.id, client.id);
      this.userStatus.set(user.id, 'online');
      this.server.emit('presence.update', {
        userId: user.id,
        status: 'online',
        onlineUserIds: this.getOnlineUserIds(),
      });
      client.emit('presence.snapshot', {
        ...this.getPresenceSnapshot(),
      });

      // 참여하는 DM/채널 룸에 자동 입장
      const dmRooms = await this.chatService.getUserDmRoomIds(user.id);
      dmRooms.forEach(roomId => client.join(roomId));

      const channelRooms = await this.chatService.getUserChannelIds(user.id);
      channelRooms.forEach(channelId => client.join(`channel:${channelId}`));

      console.log(`User ${user.id} connected with socket ${client.id}`);
    } catch (err) {
      console.error('handleConnection error:', err);
      client.disconnect();
    }
  }

  /** 클라이언트 연결 해제 */
  handleDisconnect(client: Socket) {
    const userEntry = Array.from(this.onlineUsers.entries()).find(([_, id]) => id === client.id);
    if (!userEntry) return;

    const userId = userEntry[0];
    this.onlineUsers.delete(userId);
    this.userStatus.set(userId, 'offline');
    this.server.emit('presence.update', {
      userId,
      status: 'offline',
      onlineUserIds: this.getOnlineUserIds(),
    });

    for (const [parentId, viewers] of this.threadViewers) {
      viewers.delete(userId);
      if (viewers.size === 0) {
        this.threadViewers.delete(parentId);
      }
    }
  }

  @OnEvent('linkPreview.created')
  handleLinkPreviewCreated(payload: { scope: 'CHANNEL' | 'DM'; message: ChannelMessage | DmMessage; preview: any }) {
    const room =
      payload.scope === 'CHANNEL'
        ? `channel:${(payload.message as ChannelMessage).channel.id}`
        : (payload.message as DmMessage).room.id;

    this.server.to(room).emit('message.updated', {
      messageId: payload.message.id,
      linkPreview: payload.preview,
    });
  }

  /** 채널 메시지 전송 */
  @SubscribeMessage('send-channel-message')
  async handleSendChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendChannelMessageDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const message = await this.chatService.sendChannelMessage(user, body);
    this.emitMessageEvent(
      `channel:${body.channelId}`,
      'created',
      mapMessageToResponse(message, user.id),
    );
  }

  /** 채널 메시지 읽음 처리 */
  @SubscribeMessage('channel.read')
  async handleChannelRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    const user = await this.chatService.getUserBySocket(client);
    await this.chatService.markChannelRead(body.channelId, user);
    this.server.to(`channel:${body.channelId}`).emit('channel.read.updated', {
      channelId: body.channelId,
      userId: user.id,
      readAt: new Date(),
    });
  }

  /** DM 메시지 전송 */
  @SubscribeMessage('send-dm')
  async handleSendDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsSendDMDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const message = await this.chatService.sendDM(user, {
      roomId: body.roomId,
      content: body.content,
    });

    client.emit('message.ack', {
      tempId: body.tempId,
      messageId: message.id,
      createdAt: message.createdAt
    });

    this.emitMessageEvent(
      message.room.id,
      'created',
      mapMessageToResponse(message, user.id),
    );
  }

  /** DM 메시지 읽음 처리 */
  @SubscribeMessage('read-dm')
  async handleReadDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsReadDMDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    await this.chatService.markDmRead(body.roomId, user);
    this.server.to(body.roomId).emit('dm.read.updated', {
      roomId: body.roomId,
      userId: user.id,
      readAt: new Date(),
    });
  }

  /** 타이핑 이벤트 */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsTypingDto,
  ) {
    this.server
      .to(body.roomId)
      .emit('user-typing', body);
  }

  @SubscribeMessage('edit-message')
  async handleEditMessage(
    client: Socket,
    body: WsEditMessageDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const updated = await this.chatService.editMessage(user, body.messageId, body.content);
    const scoped = await this.chatService.findScopedMessageById(updated.id);

    this.emitMessageEvent(
      this.resolveMessageRoom(scoped),
      'updated',
      mapMessageToResponse(updated, user.id),
    );
  }

  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    client: Socket,
    body: WsDeleteMessageDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const deleted = await this.chatService.deleteMessage(user, body.messageId);
    const scoped = await this.chatService.findScopedMessageById(deleted.id);

    this.emitMessageEvent(
      this.resolveMessageRoom(scoped),
      'deleted',
      { messageId: deleted.id },
    );
  }

  @SubscribeMessage('toggle-reaction')
  async handleToggleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ToggleReactionDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const result = await this.chatService.toggleReaction(user, body.messageId, body.emoji);
    const scoped = await this.chatService.findScopedMessageById(body.messageId);
    

    this.emitMessageEvent(
      this.resolveMessageRoom(scoped),
      'reaction',
      {
        messageId: scoped.message.id,
        emoji: body.emoji,
        userId: user.id,
        action: result.action,
      },
    );
  }

  @SubscribeMessage('send-thread-message')
  async handleSendThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendThreadMessageDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const scoped = await this.chatService.findScopedMessageById(body.threadParentId);

    if (scoped.scope !== 'CHANNEL') {
      throw new ForbiddenException('DM에는 스레드를 사용할 수 없습니다.');
    }

    const parent = scoped.message as ChannelMessage;
    const reply = await this.chatService.sendThreadMessage(user, body.threadParentId, body.content, body.fileIds);
    const refreshedParent = await this.chatService.findScopedMessageById(parent.id);
    const unreadCount = await this.chatService.getThreadUnreadCount(parent.id, user.id);
    const room = `channel:${parent.channel.id}`;

    this.emitMessageEvent(room, 'thread_created', {
      parentMessageId: parent.id,
      message: mapMessageToResponse(reply, user.id),
    });

    this.emitMessageEvent(room, 'thread_meta', {
      parentMessageId: parent.id,
      thread: {
        replyCount: (refreshedParent.message as ChannelMessage).threadCount,
        unreadCount,
        lastReplyAt: (refreshedParent.message as ChannelMessage).lastThreadAt,
      },
    });
  }

  @SubscribeMessage('thread.open')
  async handleThreadOpen(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadParentId: string },
  ) {
    const user = await this.chatService.getUserBySocket(client);

    const viewers =
      this.threadViewers.get(body.threadParentId) ?? new Set<string>();

    viewers.add(user.id);
    this.threadViewers.set(body.threadParentId, viewers);

    await this.chatService.markThreadRead(user, body.threadParentId);

    this.server.emit('thread.viewers.updated', {
      threadParentId: body.threadParentId,
      viewers: Array.from(viewers),
      count: viewers.size,
    });
  }

  @SubscribeMessage('thread.close')
  async handleThreadClose(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadParentId: string },
  ) {
    const user = await this.chatService.getUserBySocket(client);

    const viewers = this.threadViewers.get(body.threadParentId);
    if (!viewers) return;

    viewers.delete(user.id);

    if (viewers.size === 0) {
      this.threadViewers.delete(body.threadParentId);
    }

    this.server.emit('thread.viewers.updated', {
      threadParentId: body.threadParentId,
      viewers: Array.from(viewers),
      count: viewers.size,
    });
  }

  @SubscribeMessage('thread.typing')
  async handleThreadTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { threadParentId: string; isTyping: boolean },
  ) {
    const user = await this.chatService.getUserBySocket(client);

    const viewers = this.threadViewers.get(body.threadParentId);
    if (!viewers) return;

    for (const viewerId of viewers) {
      const socketId = this.onlineUsers.get(viewerId);
      if (!socketId || viewerId === user.id) continue;

      this.server.to(socketId).emit('thread.user.typing', {
        threadParentId: body.threadParentId,
        userId: user.id,
        isTyping: body.isTyping,
      });
    }
  }

  @SubscribeMessage('pin-message')
  async handlePinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { messageId: string },
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const pinned = await this.chatService.pinMessage(user, body.messageId);

    this.server
      .to(`channel:${pinned.channel.id}`)
      .emit('message.pinned', {
        messageId: pinned.message.id,
        pinnedBy: user.id,
        pinnedAt: pinned.pinnedAt,
      });
  }

  @SubscribeMessage('unpin-message')
  async handleUnpinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { messageId: string },
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const pinned = await this.chatService.unpinMessage(user, body.messageId);

    this.server
      .to(`channel:${pinned.channel.id}`)
      .emit('message.unpinned', {
        messageId: body.messageId,
      });
  }

  @SubscribeMessage('toggle-save-message')
  async handleToggleSave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { messageId: string },
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const result = await this.chatService.toggleSaveMessage(user, body.messageId);

    client.emit(
      result.action === 'added'
        ? 'message.saved'
        : 'message.unsaved',
      { messageId: body.messageId },
    );
  }
}
