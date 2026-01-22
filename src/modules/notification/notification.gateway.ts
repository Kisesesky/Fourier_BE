import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Notification } from "./entities/notification.entity";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ namespace: '/notification' })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  push(notification: Notification) {
    this.server
      .to(`user:${notification.user.id}`)
      .emit('notification', notification);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, userId: string) {
    const authUserId = client.handshake.auth?.userId;

    if (authUserId !== userId) {
      client.disconnect();
      return;
    }
    client.join(`user:${userId}`);
  }

  emitUser(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }
}