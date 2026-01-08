// src/modules/chat/gateways/gateway.service.ts
import { Injectable } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class GatewayService {
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService
  ) {}

  authenticate(client: Socket): string {
    const token = client.handshake.auth?.token;
    if (!token) {
      throw new WsException('UNAUTHORIZED');
    }

    const payload = this.jwtService.verify<JwtPayload>(token);
    const userId = payload.sub;
    client.data.userId = userId;

    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(client.id);

    return userId;
  }

  handleDisconnect(client: Socket, server?: Server) {
    const userId = client.data.userId;
    if (!userId) return;

    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(client.id);

    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
      if (server) {
        server.emit('presence-update', {
          userId,
          status: 'offline',
        });
      }
    }
  }

  getOnlineUsers(): Map<string, Set<string>> {
    return this.onlineUsers;
  }
}