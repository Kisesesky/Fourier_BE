// src/modules/activity-log/activity.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { AppConfigService } from 'src/config/app/config.service';
import { ActivityFeedItemDto } from '../dto/activity-feed-item.dto';

@WebSocketGateway({
  namespace: '/activity',
  cors: { origin: true },
})
export class ActivityGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly config: AppConfigService) {}

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      const payload: any = jwt.verify(token, this.config.jwtSecret);

      client.join(`team:${payload.teamId}`);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  emitTeamActivity(teamId: string, payload: ActivityFeedItemDto) {
    this.server.to(`team:${teamId}`).emit('team.activity', payload);
  }
}