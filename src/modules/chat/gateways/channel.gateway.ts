// src/modules/chat/gateways/channel.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ValidationPipe } from '@nestjs/common';
import { ChannelChatService } from '../channel-chat.service';
import { GatewayService } from './gateway.service';

@WebSocketGateway({
  namespace: '/channel',
  cors: { origin: true }
})
export class ChannelGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly channelChatService: ChannelChatService,
    private readonly gatewayService: GatewayService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const userId = this.gatewayService.authenticate(client);
      const channelIds = await this.channelChatService.getMyChannelIds(userId);
      channelIds.forEach((id) => client.join(`channel:${id}`));
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.gatewayService.handleDisconnect(client);
  }

  private getUserId(client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('UNAUTHORIZED');
    }
    return userId;
  }

  @SubscribeMessage('join-channel')
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe()) body: { channelId: string }
  ) {
    const userId = this.getUserId(client);
    await this.channelChatService.verifyChannelAccess(body.channelId, userId);
    client.join(`channel:${body.channelId}`);
    await this.channelChatService.markChannelAsRead(body.channelId, userId, new Date());
    return { ok: true, data: { channelId: body.channelId } };
  }

  @SubscribeMessage('send-channel-message')
  async handleSendChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe()) body: {
      channelId: string;
      content: string;
      tempId?: string
    }
  ) {
    const userId = this.getUserId(client);
    if (await this.channelChatService.isMuted(body.channelId, userId)) {
      return { ok: false, error: 'CHANNEL_MUTED' };
    }

    const message = await this.channelChatService.sendMessage(body.channelId, userId, body.content);

    client.emit('channel-message-ack', {
      ok: true,
      data: {
        tempId: body.tempId,
        messageId: message.id,
        createdAt: message.createdAt
      }
    });
    this.server.to(`channel:${body.channelId}`).emit('new-channel-message', {
      id: message.id,
      channelId: body.channelId,
      senderId: userId,
      content: message.content,
      createdAt: message.createdAt
    });
  }

  @SubscribeMessage('read-channel')
  async handleReadChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe()) body: {
      channelId: string;
      lastReadAt: string
    }
  ) {
    const userId = this.getUserId(client);
    await this.channelChatService.markChannelAsRead(body.channelId, userId, new Date(body.lastReadAt));
    return { ok: true };
  }

  @SubscribeMessage('delete-channel-message')
  async handleDeleteChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe()) body: { messageId: string }
  ) {
    const userId = this.getUserId(client);
    const result = await this.channelChatService.deleteMessage(body.messageId, userId);
    this.server.to(`channel:${result.channelId}`).emit('channel-message-updated', {
      messageId: result.messageId,
      content: result.content
    });
    return { ok: true };
  }
}