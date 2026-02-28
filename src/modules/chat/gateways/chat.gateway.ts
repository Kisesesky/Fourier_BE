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
import { SfuFacade } from 'src/modules/sfu/sfu.facade';
import {
  WsSfuCloseProducerDto,
  WsSfuConnectTransportDto,
  WsSfuConsumeDto,
  WsSfuCreateTransportDto,
  WsSfuHostActionDto,
  WsSfuJoinDto,
  WsSfuLeaveDto,
  WsSfuProduceDto,
  WsSfuRequestDto,
} from '../dto/ws-sfu.dto';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private onlineUsers = new Map<string, string>();
  private socketUsers = new Map<string, string>();
  private threadViewers = new Map<string, Set<string>>();
  private userStatus = new Map<string, 'online' | 'offline' | 'away' | 'dnd'>();
  private huddleParticipants = new Map<string, Set<string>>();

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly sfuService: SfuFacade,
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

  private getRoomUserIds(roomName: string): string[] {
    const room = this.server?.sockets?.adapter?.rooms?.get(roomName);
    if (!room) return [];
    const userIds = new Set<string>();
    for (const socketId of room.values()) {
      const userId = this.socketUsers.get(socketId);
      if (userId) userIds.add(userId);
    }
    return Array.from(userIds);
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
      this.socketUsers.set(client.id, user.id);
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
    const userId = this.socketUsers.get(client.id);
    if (!userId) return;
    this.socketUsers.delete(client.id);
    this.onlineUsers.delete(userId);
    this.userStatus.set(userId, 'offline');
    this.server.emit('presence.update', {
      userId,
      status: 'offline',
      onlineUserIds: this.getOnlineUserIds(),
    });

    for (const [channelId, members] of this.huddleParticipants.entries()) {
      if (!members.has(userId)) continue;
      members.delete(userId);
      this.server.to(`channel:${channelId}`).emit('webrtc.user-left', { channelId, userId });
      if (members.size === 0) {
        this.huddleParticipants.delete(channelId);
      }
    }

    for (const [parentId, viewers] of this.threadViewers) {
      viewers.delete(userId);
      if (viewers.size === 0) {
        this.threadViewers.delete(parentId);
      }
    }

    const leftSfuRooms = this.sfuService.leaveUserFromAllRooms({ userId });
    for (const roomId of leftSfuRooms) {
      this.server.to(`channel:${roomId}`).emit('sfu.peer-left', {
        roomId,
        userId,
      });
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

  @OnEvent('sfu.worker.died')
  handleSfuWorkerDied() {
    this.server.emit('sfu:worker-died', {
      message: 'SFU worker died. Reconnecting required.',
    });
  }

  @OnEvent('sfu.worker.ready')
  handleSfuWorkerReady() {
    this.server.emit('sfu:worker-ready', {
      message: 'SFU worker is ready.',
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

  @SubscribeMessage('webrtc.join')
  async handleWebrtcJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string; mode?: 'audio' | 'video' },
  ) {
    const user = await this.chatService.getUserBySocket(client);
    if (!body?.channelId) return;
    const roomName = `channel:${body.channelId}`;
    const participants = this.getRoomUserIds(roomName).filter((id) => id !== user.id);

    const current = this.huddleParticipants.get(body.channelId) ?? new Set<string>();
    current.add(user.id);
    this.huddleParticipants.set(body.channelId, current);

    client.emit('webrtc.participants', {
      channelId: body.channelId,
      participants,
    });
    client.to(roomName).emit('webrtc.user-joined', {
      channelId: body.channelId,
      userId: user.id,
      mode: body.mode ?? 'audio',
    });
    client.to(roomName).emit('webrtc.media-state', {
      channelId: body.channelId,
      userId: user.id,
      track: 'audio',
      enabled: true,
    });
  }

  @SubscribeMessage('webrtc.leave')
  async handleWebrtcLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    const user = await this.chatService.getUserBySocket(client);
    if (!body?.channelId) return;
    const members = this.huddleParticipants.get(body.channelId);
    if (members) {
      members.delete(user.id);
      if (members.size === 0) this.huddleParticipants.delete(body.channelId);
    }
    client.to(`channel:${body.channelId}`).emit('webrtc.user-left', {
      channelId: body.channelId,
      userId: user.id,
    });
  }

  @SubscribeMessage('webrtc.offer')
  async handleWebrtcOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string; targetUserId: string; sdp: any },
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const targetSocketId = this.onlineUsers.get(body.targetUserId);
    if (!targetSocketId) return;
    this.server.to(targetSocketId).emit('webrtc.offer', {
      channelId: body.channelId,
      fromUserId: user.id,
      sdp: body.sdp,
    });
  }

  @SubscribeMessage('webrtc.answer')
  async handleWebrtcAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string; targetUserId: string; sdp: any },
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const targetSocketId = this.onlineUsers.get(body.targetUserId);
    if (!targetSocketId) return;
    this.server.to(targetSocketId).emit('webrtc.answer', {
      channelId: body.channelId,
      fromUserId: user.id,
      sdp: body.sdp,
    });
  }

  @SubscribeMessage('webrtc.ice-candidate')
  async handleWebrtcIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { channelId: string; targetUserId: string; candidate: any },
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const targetSocketId = this.onlineUsers.get(body.targetUserId);
    if (!targetSocketId) return;
    this.server.to(targetSocketId).emit('webrtc.ice-candidate', {
      channelId: body.channelId,
      fromUserId: user.id,
      candidate: body.candidate,
    });
  }

  @SubscribeMessage('webrtc.media-state')
  async handleWebrtcMediaState(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { channelId: string; track: 'audio' | 'video' | 'screen'; enabled: boolean },
  ) {
    const user = await this.chatService.getUserBySocket(client);
    if (!body?.channelId || !body?.track) return;
    client.to(`channel:${body.channelId}`).emit('webrtc.media-state', {
      channelId: body.channelId,
      userId: user.id,
      track: body.track,
      enabled: !!body.enabled,
    });
  }

  @SubscribeMessage('sfu.get-capabilities')
  async handleSfuCapabilities(
    @ConnectedSocket() client: Socket,
    @MessageBody() body?: WsSfuRequestDto,
  ) {
    await this.chatService.getUserBySocket(client);
    client.emit('sfu.capabilities', {
      requestId: body?.requestId,
      routerRtpCapabilities: this.sfuService.getRouterRtpCapabilities(),
      runtime: this.sfuService.getRuntimeInfo(),
    });
  }

  @SubscribeMessage('sfu.join')
  async handleSfuJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsSfuJoinDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    if (!body?.channelId) return;
    const roomId = body.channelId;
    const access = await this.chatService.getSfuChannelAccess(roomId, user.id);
    const joined = this.sfuService.joinRoom({ roomId, userId: user.id, socketId: client.id });
    const persisted = await this.sfuService.getPersistedRoomSnapshot({ roomId, exceptUserId: user.id });
    const inMemoryMediaStates = this.sfuService.listRoomMediaStates({ roomId, exceptUserId: user.id });
    const mergedMediaStates = {
      ...(persisted?.mediaStates ?? {}),
      ...inMemoryMediaStates,
    };
    client.emit('sfu.joined', {
      requestId: body.requestId,
      roomId,
      peers: joined.peers.filter((peerId) => peerId !== user.id),
      producers: this.sfuService.listRoomProducers({ roomId, exceptUserId: user.id }),
      mediaStates: mergedMediaStates,
      recoveredSnapshotAt: persisted?.updatedAt ?? null,
      access,
    });
    client.to(`channel:${body.channelId}`).emit('sfu.peer-joined', {
      roomId,
      userId: user.id,
    });
  }

  @SubscribeMessage('sfu.leave')
  async handleSfuLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsSfuLeaveDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    if (!body?.channelId) return;
    this.sfuService.leaveRoom({ roomId: body.channelId, userId: user.id });
    client.to(`channel:${body.channelId}`).emit('sfu.peer-left', {
      roomId: body.channelId,
      userId: user.id,
    });
  }

  @SubscribeMessage('sfu.create-transport')
  async handleSfuCreateTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsSfuCreateTransportDto,
  ) {
    try {
      const user = await this.chatService.getUserBySocket(client);
      if (!body?.channelId || !body?.direction) return;
      const access = await this.chatService.getSfuChannelAccess(body.channelId, user.id);
      if (body.direction === 'send' && !access.canProduce) {
        client.emit('sfu.error', {
          op: 'create-transport',
          message: '송신 권한이 없습니다.',
        });
        return;
      }
      const transport = await this.sfuService.createWebRtcTransport({
        roomId: body.channelId,
        userId: user.id,
        direction: body.direction,
      });
      client.emit('sfu.transport-created', {
        requestId: body.requestId,
        roomId: body.channelId,
        direction: body.direction,
        transport,
      });
    } catch (error: any) {
      client.emit('sfu.error', {
        op: 'create-transport',
        message: error?.message ?? 'unknown error',
      });
    }
  }

  @SubscribeMessage('sfu.connect-transport')
  async handleSfuConnectTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsSfuConnectTransportDto,
  ) {
    try {
      await this.chatService.getUserBySocket(client);
      if (!body?.transportId) return;
      await this.sfuService.connectTransport({
        transportId: body.transportId,
        dtlsParameters: body.dtlsParameters,
      });
      client.emit('sfu.transport-connected', {
        requestId: body.requestId,
        roomId: body.channelId,
        transportId: body.transportId,
      });
    } catch (error: any) {
      client.emit('sfu.error', {
        op: 'connect-transport',
        message: error?.message ?? 'unknown error',
      });
    }
  }

  @SubscribeMessage('sfu.produce')
  async handleSfuProduce(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsSfuProduceDto,
  ) {
    try {
      const user = await this.chatService.getUserBySocket(client);
      if (!body?.channelId || !body?.transportId || !body?.kind) return;
      const access = await this.chatService.getSfuChannelAccess(body.channelId, user.id);
      if (!access.canProduce) {
        client.emit('sfu.error', {
          op: 'produce',
          message: '발언 권한이 없습니다.',
        });
        return;
      }
      const producer = await this.sfuService.produce({
        roomId: body.channelId,
        userId: user.id,
        transportId: body.transportId,
        kind: body.kind,
        rtpParameters: body.rtpParameters,
        appData: body.appData,
      });
      client.emit('sfu.produced', {
        requestId: body.requestId,
        roomId: body.channelId,
        producerId: producer.id,
        kind: body.kind,
      });
      client.to(`channel:${body.channelId}`).emit('sfu.new-producer', {
        roomId: body.channelId,
        userId: user.id,
        producerId: producer.id,
        kind: body.kind,
      });
      client.to(`channel:${body.channelId}`).emit('sfu.media-state', {
        roomId: body.channelId,
        userId: user.id,
        state: this.sfuService.getUserMediaState({ roomId: body.channelId, userId: user.id }),
      });
    } catch (error: any) {
      client.emit('sfu.error', {
        op: 'produce',
        message: error?.message ?? 'unknown error',
      });
    }
  }

  @SubscribeMessage('sfu.consume')
  async handleSfuConsume(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsSfuConsumeDto,
  ) {
    try {
      const user = await this.chatService.getUserBySocket(client);
      if (!body?.channelId || !body?.transportId || !body?.producerId) return;
      const consumer = await this.sfuService.consume({
        roomId: body.channelId,
        userId: user.id,
        transportId: body.transportId,
        producerId: body.producerId,
        rtpCapabilities: body.rtpCapabilities,
      });
      client.emit('sfu.consumed', {
        requestId: body.requestId,
        roomId: body.channelId,
        consumer,
      });
    } catch (error: any) {
      client.emit('sfu.error', {
        op: 'consume',
        message: error?.message ?? 'unknown error',
      });
    }
  }

  @SubscribeMessage('sfu.close-producer')
  async handleSfuCloseProducer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsSfuCloseProducerDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    if (!body?.channelId || !body?.producerId) return;
    this.sfuService.closeProducer({
      roomId: body.channelId,
      userId: user.id,
      producerId: body.producerId,
    });
    client.to(`channel:${body.channelId}`).emit('sfu.producer-closed', {
      roomId: body.channelId,
      userId: user.id,
      producerId: body.producerId,
    });
    client.to(`channel:${body.channelId}`).emit('sfu.media-state', {
      roomId: body.channelId,
      userId: user.id,
      state: this.sfuService.getUserMediaState({ roomId: body.channelId, userId: user.id }),
    });
  }

  @SubscribeMessage('sfu.host-force-mute')
  async handleSfuHostForceMute(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsSfuHostActionDto,
  ) {
    try {
      const actor = await this.chatService.getUserBySocket(client);
      if (!body?.channelId || !body?.targetUserId) return;
      const access = await this.chatService.getSfuChannelAccess(body.channelId, actor.id);
      if (access.callRole !== 'host') {
        client.emit('sfu.error', { op: 'host-force-mute', message: '호스트 권한이 필요합니다.' });
        return;
      }
      const closedProducerIds = this.sfuService.closeUserProducers({
        roomId: body.channelId,
        userId: body.targetUserId,
      });
      for (const producerId of closedProducerIds) {
        this.server.to(`channel:${body.channelId}`).emit('sfu.producer-closed', {
          roomId: body.channelId,
          userId: body.targetUserId,
          producerId,
        });
      }
      this.server.to(`channel:${body.channelId}`).emit('sfu.media-state', {
        roomId: body.channelId,
        userId: body.targetUserId,
        state: this.sfuService.getUserMediaState({ roomId: body.channelId, userId: body.targetUserId }),
      });
      this.server.to(`channel:${body.channelId}`).emit('sfu.host-muted', {
        roomId: body.channelId,
        targetUserId: body.targetUserId,
        byUserId: actor.id,
      });
    } catch (error: any) {
      client.emit('sfu.error', {
        op: 'host-force-mute',
        message: error?.message ?? 'unknown error',
      });
    }
  }

  @SubscribeMessage('sfu.host-kick')
  async handleSfuHostKick(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsSfuHostActionDto,
  ) {
    try {
      const actor = await this.chatService.getUserBySocket(client);
      if (!body?.channelId || !body?.targetUserId) return;
      const access = await this.chatService.getSfuChannelAccess(body.channelId, actor.id);
      if (access.callRole !== 'host') {
        client.emit('sfu.error', { op: 'host-kick', message: '호스트 권한이 필요합니다.' });
        return;
      }
      const targetSocketId = this.sfuService.getPeerSocketId({
        roomId: body.channelId,
        userId: body.targetUserId,
      });
      this.sfuService.leaveRoom({ roomId: body.channelId, userId: body.targetUserId });
      this.server.to(`channel:${body.channelId}`).emit('sfu.peer-left', {
        roomId: body.channelId,
        userId: body.targetUserId,
      });
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('sfu.kicked', {
          roomId: body.channelId,
          targetUserId: body.targetUserId,
          byUserId: actor.id,
        });
      }
    } catch (error: any) {
      client.emit('sfu.error', {
        op: 'host-kick',
        message: error?.message ?? 'unknown error',
      });
    }
  }
}
