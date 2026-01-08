// src/modules/chat/gateways/message.gateway.ts
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
import { ChatService } from '../chat.service';
import { GatewayService } from './gateway.service';
import { ValidationPipe } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/dm',
  cors: { origin: true }
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly gatewayService: GatewayService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const userId = this.gatewayService.authenticate(client);
      const rooms = await this.chatService.getMyRooms(userId);
      rooms.forEach((room) => client.join(room.id));

      // 온라인 상태 알림
      if (this.gatewayService.getOnlineUsers().get(userId)!.size === 1) {
        this.server.emit('presence-update', { userId, status: 'online' });
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.gatewayService.handleDisconnect(client, this.server);
  }

  private getUserId(client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('UNAUTHORIZED');
    }
    return userId;
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket, 
    @MessageBody(new ValidationPipe()) body: { roomId: string }
  ) {
    const userId = this.getUserId(client);
    client.join(body.roomId);
    return { ok: true, roomId: body.roomId };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe()) body: { roomId: string; content: string; tempId?: string },
  ) {
    const userId = this.getUserId(client);
    try {
      const [message] = await this.chatService.sendMessage(body.roomId, userId, body.content);

      // ACK
      client.emit('dm-message-ack', {
        ok: true,
        data: {
          tempId: body.tempId,
          messageId: message.id,
          createdAt: message.createdAt
        }
      });

      // Broadcast
      this.server.to(body.roomId).emit('new-dm-message', {
        id: message.id,
        roomId: body.roomId,
        senderId: userId,
        content: message.content,
        createdAt: message.createdAt,
      });
    } catch {
      client.emit('dm-message-ack', { ok: false, error: 'SEND_FAILED' });
    }
  }

  @SubscribeMessage('read-room')
  async handleReadRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe()) body: { roomId: string }
  ) {
    const userId = this.getUserId(client);
    await this.chatService.markRoomAsRead(body.roomId, userId);
    this.server.to(body.roomId).emit('dm-read-update', { roomId: body.roomId, userId });
  }

  @SubscribeMessage('typing-start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe()) body: { roomId: string }
  ) {
    const userId = this.getUserId(client);
    client.to(body.roomId).emit('typing-update', { roomId: body.roomId, userId, isTyping: true });
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe()) body: { roomId: string }
  ) {
    const userId = this.getUserId(client);
    client.to(body.roomId).emit('typing-update', { roomId: body.roomId, userId, isTyping: false });
  }
}