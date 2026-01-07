// src/modules/chat/gateways/message.gateway.ts
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
import { JwtService } from '@nestjs/jwt';
import { ValidationPipe } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ChatService } from '../chat.service';

@WebSocketGateway({
  namespace: '/dm',
  cors: { origin: true },
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) throw new WsException('인증 토큰이 없습니다.');

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      client.data.userId = userId;

      // presence
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
        this.server.emit('presence-update', {
          userId,
          status: 'online',
        });
      }
      this.onlineUsers.get(userId)!.add(client.id);

      // 내가 속한 DM room join
      const rooms = await this.chatService.getMyRooms(userId);
      rooms.forEach((room) => client.join(room.id));
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

    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
      this.server.emit('presence-update', {
        userId,
        status: 'offline',
      });
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: { roomId: string },
  ) {
    if (!client.data.userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    client.join(body.roomId);
    return { ok: true, roomId: body.roomId };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: {
      roomId: string;
      content: string;
      tempId?: string;
    },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('인증되지 않은 사용자입니다.');

    try {
      const [message] = await this.chatService.sendMessage(
        body.roomId,
        userId,
        body.content,
      );

      // ACK
      client.emit('dm-message-ack', {
        ok: true,
        data: {
          tempId: body.tempId,
          messageId: message.id,
          createdAt: message.createdAt,
        },
      });

      // broadcast
      this.server.to(body.roomId).emit('new-dm-message', {
        id: message.id,
        roomId: body.roomId,
        senderId: userId,
        content: message.content,
        createdAt: message.createdAt,
      });
    } catch {
      client.emit('dm-message-ack', {
        ok: false,
        error: 'SEND_FAILED',
      });
    }
  }

  @SubscribeMessage('read-room')
  async handleReadRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true }))
    body: { roomId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('인증되지 않은 사용자입니다.');

    await this.chatService.markRoomAsRead(body.roomId, userId);

    this.server.to(body.roomId).emit('dm-read-update', {
      roomId: body.roomId,
      userId,
    });

    return { ok: true };
  }

  @SubscribeMessage('typing-start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true }))
    body: { roomId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(body.roomId).emit('typing-update', {
      roomId: body.roomId,
      userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true }))
    body: { roomId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(body.roomId).emit('typing-update', {
      roomId: body.roomId,
      userId,
      isTyping: false,
    });
  }
}