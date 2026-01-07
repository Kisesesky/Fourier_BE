// src/modules/chat/chat.gateway.ts
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
import { WsJoinChannelDto } from './dto/ws-join-channel.dto';
import { ChannelChatService } from './channel-chat.service';
import { WsDeleteChannelMessageDto } from './dto/ws-delete-channel-message.dto';
import { WsReadChannelDto } from './dto/ws-read-channel.dto';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly channelChatService: ChannelChatService,
  ) {}

  /** 1. WebSocket 연결 시 JWT 인증  */
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

      const channelIds = await this.channelChatService.getMyChannelIds(userId);
      channelIds.forEach((id) => {
        client.join(`channel:${id}`);
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

  /** 2. 채팅방 입장 */
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

  @SubscribeMessage('join-channel')
  async handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: WsJoinChannelDto,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    // 1. 채널 접근 권한 확인
    await this.channelChatService.verifyChannelAccess(
      body.channelId,
      userId,
    );

    // 2. 소켓 room join
    client.join(`channel:${body.channelId}`);

    // 3. 읽음 처리 (입장 = 읽음 기준점)
    await this.channelChatService.markChannelAsRead(
      body.channelId,
      userId,
      new Date(),
    );

    return {
      joined: body.channelId,
    };
  }

  /** 3. 메시지 전송 */
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

  /** 4. 읽음 처리 이벤트 */
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

  @SubscribeMessage('read-channel')
  async handleReadChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: WsReadChannelDto,
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException('인증 필요');

    await this.channelChatService.markChannelAsRead(
      body.channelId,
      userId,
      new Date(body.lastReadAt),
    );
  }

  /** 5. 메세지 삭제  */
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

  /** 6. 채널 메시지 전송 */
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
    if (!userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    const message = await this.channelChatService.sendMessage(
      body.channelId,
      userId,
      body.content,
    );

    // ACK
    client.emit('message-ack', {
      tempId: body.tempId,
      messageId: message.id,
      createdAt: message.createdAt,
    });

    // broadcast
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

  /** 7. 채널 메세지 삭제 */
  @SubscribeMessage('delete-channel-message')
  async handleDeleteChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe({ whitelist: true })) body: WsDeleteChannelMessageDto,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    const result = await this.channelChatService.deleteMessage(body.messageId, userId);

    this.server.to(`channel:${result.channelId}`).emit(
      'channel-message-updated',
      {
        messageId: result.messageId,
        content: result.content,
      },
    );
  }

  /** 8. typing event */
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
    if (!userId) {
      throw new WsException('인증되지 않은 사용자입니다.');
    }

    const messages = await this.channelChatService.getChannelMessages(
      body.channelId,
      userId,
      body.limit || 20,
      body.cursor,
    );

    return messages;
  }
}