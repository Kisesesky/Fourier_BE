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
import { ChatService } from './chat.service';
import { WsException } from '@nestjs/websockets';
import { ValidationPipe } from '@nestjs/common';
import { WsSendMessageDto } from './dto/ws-send-message.dto';
import { WsJoinRoomDto } from './dto/ws-join-room.dto';
import { WsReadRoomDto } from './dto/ws-read-room.dto';
import { WsTypingDto } from './dto/ws-typing.dto';
import { WsDeleteMessageDto } from './dto/ws-delete-message.dto';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: true },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  private onlineUsers = new Map<string, Set<string>>();


  @SubscribeMessage('get-online-users')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    return { onlineUserIds };
  }

  /**
   * STEP 1. WebSocket 연결 시 JWT 인증
   */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new WsException('인증 토큰이 없습니다.');
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      client.data.userId = userId;

      // online 처리
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
        this.server.emit('presence-update', {
          userId,
          status: 'online',
        });
      }
      this.onlineUsers.get(userId)!.add(client.id);

      const rooms = await this.chatService.getMyRooms(payload.sub);
      rooms.forEach((room) => {
        client.join(room.id);
      });
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(client.id);

    // 모든 socket이 끊겼을 때만 offline
    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
      this.server.emit('presence-update', {
        userId,
        status: 'offline',
      });
    }
  }

  /**
   * STEP 2. 채팅방 입장
   */
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: WsJoinRoomDto,
  ) {
    if (!client.data.userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    client.join(body.roomId);
    return { joined: body.roomId };
  }

  /**
   * STEP 3. 메시지 전송
   */
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: WsSendMessageDto,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    try {
      const [message] = await this.chatService.sendMessage(
        body.roomId,
        userId,
        body.content,
      );

      // 1. ACK (보낸 사람에게만)
      client.emit('message-ack', {
        tempId: body.tempId,
        messageId: message.id,
        createdAt: message.createdAt,
      });

      // 2. 실제 메시지 브로드캐스트
      this.server.to(body.roomId).emit('new-message', {
        id: message.id,
        roomId: body.roomId,
        senderId: userId,
        content: message.content,
        createdAt: message.createdAt,
      })
    } catch (error) {
      client.emit('message-ack', {
        tempId: body.tempId,
        error: 'MESSAGE_SEND_FAILED'
      });
    }
  }

  /**
   * STEP 4. 읽음 처리 이벤트
   */
  @SubscribeMessage('read-room')
  async handleReadRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: WsReadRoomDto,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    await this.chatService.markRoomAsRead(body.roomId, userId);

    this.server.to(body.roomId).emit('read-update', {
      roomId: body.roomId,
      userId,
    });
  }

  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: WsDeleteMessageDto,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    const result = await this.chatService.deleteMessage(
      body.messageId,
      userId,
    );

    if (result.type === 'hard-delete') {
      this.server.to(result.roomId).emit('message-deleted', {
        messageId: result.messageId,
      });
    }

    if (result.type === 'soft-delete') {
      this.server.to(result.roomId).emit('message-updated', {
        messageId: result.messageId,
        content: result.content,
      });
    }
  }

  /**
   * typing event
   */
  @SubscribeMessage('typing-start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: WsTypingDto,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    client.to(body.roomId).emit('typing-update', {
      roomId: body.roomId,
      userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: WsTypingDto,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    client.to(body.roomId).emit('typing-update', {
      roomId: body.roomId,
      userId,
      isTyping: false,
    });
  }
}