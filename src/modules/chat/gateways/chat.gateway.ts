// src/modules/chat/chat.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsSendDMDto } from '../dto/ws-send-dm.dto';
import { WsReadMessageDto } from '../dto/ws-read-message.dto';
import { WsReadDMDto } from '../dto/ws-read-dm.dto';
import { WsTypingDto } from '../dto/ws-typing.dto';
import { ChatService } from '../chat.service';
import { SendChannelMessageDto } from '../dto/send-channel-message.dto';
import { SendDmMessageDto } from '../dto/send-dm-message.dto';
import { MessageType } from '../constants/message-type.enum';
import { mapMessageToResponse } from '../utils/message.mapper';
import { WsEditMessageDto } from '../dto/ws-edit-message.dto';
import { WsDeleteMessageDto } from '../dto/ws-delete-message.dto';
import { ToggleReactionDto } from '../dto/toggle-reaction.dto';
import { SendThreadMessageDto } from '../dto/send-thread-message.dto';
import { ChannelMessage } from '../entities/channel-message.entity';
import { DmMessage } from '../entities/dm-message.entity';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private onlineUsers = new Map<string, string>();
  private threadViewers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService
  ) {}

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

  private resolveMessageRoom(message: ChannelMessage | DmMessage): string {
    if (message instanceof ChannelMessage) {
      return `channel:${message.channel.id}`;
    }
    return message.room.id;
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

    for (const [parentId, viewers] of this.threadViewers) {
      viewers.delete(userId);
      if (viewers.size === 0) {
        this.threadViewers.delete(parentId);
      }
    }
  }

  /** 채널 메시지 전송 */
  @SubscribeMessage('send-channel-message')
  async handleSendChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendChannelMessageDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const message = await this.chatService.sendChannelMessage(user, body);
    const response = mapMessageToResponse(message, user.id);
    const room = `channel:${body.channelId}`;
    this.emitMessageEvent(
      room,
      'created',
      response,
    );
  }

  /** 채널 메시지 읽음 처리 */
  @SubscribeMessage('read-channel-message')
  async handleReadChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsReadMessageDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const message = await this.chatService.markChannelMessageRead(body.messageId, user);
    this.server
      .to(`channel:${message.channel.id}`)
      .emit('channel-message-read', {
        messageId: message.id,
        userId: user.id
      },
    );
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
      type: body.type ?? MessageType.TEXT,
    });

    client.emit('dm-message-ack', {
      tempId: body.tempId,
      messageId: message.id,
      createdAt: message.createdAt
    });
    const response = mapMessageToResponse(message, user.id);

    this.emitMessageEvent(
      body.roomId,
      'created',
      response,
    );
  }

  /** DM 메시지 읽음 처리 */
  @SubscribeMessage('read-dm')
  async handleReadDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: WsReadDMDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const message = await this.chatService.markDMMessageRead(body.messageId, user);
    this.server
      .to(message.room.id)
      .emit('dm-message-read', {
        messageId: message.id,
        userId: user.id
      },
    );
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
    const message = await this.chatService.editMessage(user, body.messageId, body.content);
    const room = this.resolveMessageRoom(message);
    const response = mapMessageToResponse(message, user.id);

    this.emitMessageEvent(
      room,
      'updated',
      response,
    );
  }

  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    client: Socket,
    body: WsDeleteMessageDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const message = await this.chatService.deleteMessage(user, body.messageId);
    const room = this.resolveMessageRoom(message);

    this.emitMessageEvent(
      room,
      'deleted',
      {
        messageId: message.id,
      },
    );
  }

  @SubscribeMessage('toggle-reaction')
  async handleToggleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ToggleReactionDto,
  ) {
    const user = await this.chatService.getUserBySocket(client);
    const result = await this.chatService.toggleReaction(user, body.messageId, body.emoji);
    const message = (await this.chatService.findMessageById(body.messageId));
    const room = this.resolveMessageRoom(message);

    this.emitMessageEvent(
      room,
      'reaction',
      {
        messageId: body.messageId,
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
    const reply = await this.chatService.sendThreadMessage(user, body.parentMessageId, body.content, body.fileIds);
    const room = this.resolveMessageRoom(reply);

    this.emitMessageEvent(
      room,
      'thread_created',
      {
        parentMessageId: body.parentMessageId,
        message: mapMessageToResponse(reply, user.id),
      },
    );

    const unreadCount = await this.chatService.getThreadUnreadCount(
      body.parentMessageId,
      user.id,
    );

    this.emitMessageEvent(
      room,
      'thread_meta',
      {
        parentMessageId: body.parentMessageId,
        replyCount: reply.parentMessage.replyCount,
        unreadCount,
        lastReplyAt: reply.parentMessage?.lastReplyAt ?? new Date(),
      },
    );
  }

  @SubscribeMessage('thread.open')
  async handleThreadOpen(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { parentMessageId: string },
  ) {
    const user = await this.chatService.getUserBySocket(client);

    const viewers =
      this.threadViewers.get(body.parentMessageId) ?? new Set<string>();

    viewers.add(user.id);
    this.threadViewers.set(body.parentMessageId, viewers);

    await this.chatService.markThreadRead(user, body.parentMessageId);

    this.server.emit('thread.viewers.updated', {
      parentMessageId: body.parentMessageId,
      viewers: Array.from(viewers),
      count: viewers.size,
    });
  }

  @SubscribeMessage('thread.close')
  async handleThreadClose(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { parentMessageId: string },
  ) {
    const user = await this.chatService.getUserBySocket(client);

    const viewers = this.threadViewers.get(body.parentMessageId);
    if (!viewers) return;

    viewers.delete(user.id);

    if (viewers.size === 0) {
      this.threadViewers.delete(body.parentMessageId);
    }

    this.server.emit('thread.viewers.updated', {
      parentMessageId: body.parentMessageId,
      viewers: Array.from(viewers),
      count: viewers.size,
    });
  }

  @SubscribeMessage('thread.typing')
  async handleThreadTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { parentMessageId: string; isTyping: boolean },
  ) {
    const user = await this.chatService.getUserBySocket(client);

    const viewers = this.threadViewers.get(body.parentMessageId);
    if (!viewers) return;

    for (const viewerId of viewers) {
      const socketId = this.onlineUsers.get(viewerId);
      if (!socketId || viewerId === user.id) continue;

      this.server.to(socketId).emit('thread.user.typing', {
        parentMessageId: body.parentMessageId,
        userId: user.id,
        isTyping: body.isTyping,
      });
    }
  }
}