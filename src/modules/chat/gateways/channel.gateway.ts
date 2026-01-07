// src/modules/chat/gateways/channel.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ValidationPipe } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ChannelChatService } from '../channel-chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/channel',
  cors: { origin: true },
})
export class ChannelGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly channelChatService: ChannelChatService,
    private readonly jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) throw new WsException('인증 토큰이 없습니다.');

      const payload: any = this.jwtService.verify(token);
      const userId = payload.sub;
      client.data.userId = userId;

      if (!this.onlineUsers.has(userId)) this.onlineUsers.set(userId, new Set());
      this.onlineUsers.get(userId)!.add(client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(client.id);
    if (sockets.size === 0) this.onlineUsers.delete(userId);
  }


  @SubscribeMessage('join-channel')
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: { channelId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('인증되지 않은 사용자입니다.');

    await this.channelChatService.verifyChannelAccess(
      body.channelId,
      userId,
    );

    client.join(`channel:${body.channelId}`);

    await this.channelChatService.markChannelAsRead(
      body.channelId,
      userId,
      new Date(),
    );

    return {
      ok: true,
      data: { channelId: body.channelId },
    };
  }

  @SubscribeMessage('send-channel-message')
  async handleSendChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: {
      channelId: string;
      content: string;
      tempId?: string;
    },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('인증되지 않은 사용자입니다.');

    const isMuted = await this.channelChatService.isMuted(
      body.channelId,
      userId,
    );
    if (isMuted) {
      return {
        ok: false,
        error: 'CHANNEL_MUTED',
      };
    }

    const message = await this.channelChatService.sendMessage(
      body.channelId,
      userId,
      body.content,
    );

    // ACK
    client.emit('channel-message-ack', {
      ok: true,
      data: {
        tempId: body.tempId,
        messageId: message.id,
        createdAt: message.createdAt,
      },
    });

    // Broadcast
    this.server
      .to(`channel:${body.channelId}`)
      .emit('new-channel-message', {
        id: message.id,
        channelId: body.channelId,
        senderId: userId,
        content: message.content,
        createdAt: message.createdAt,
      });
  }

  @SubscribeMessage('get-channel-messages')
  async handleGetChannelMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: {
      channelId: string;
      limit?: number;
      cursor?: string;
    },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('인증되지 않은 사용자입니다.');

    const messages = await this.channelChatService.getChannelMessages(
      body.channelId,
      userId,
      body.limit || 20,
      body.cursor,
    );

    return {
      ok: true,
      data: messages,
    };
  }

  @SubscribeMessage('read-channel')
  async handleReadChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true }))
    body: {
      channelId: string;
      lastReadAt: string;
    },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('인증되지 않은 사용자입니다.');

    await this.channelChatService.markChannelAsRead(
      body.channelId,
      userId,
      new Date(body.lastReadAt),
    );

    return { ok: true };
  }

  @SubscribeMessage('delete-channel-message')
  async handleDeleteChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: { messageId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('인증되지 않은 사용자입니다.');

    const result = await this.channelChatService.deleteMessage(
      body.messageId,
      userId,
    );

    this.server
      .to(`channel:${result.channelId}`)
      .emit('channel-message-updated', {
        messageId: result.messageId,
        content: result.content,
      });

    return { ok: true };
  }
}