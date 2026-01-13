// src/modules/docs/docs.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DocsService } from './docs.service';
import { User } from '../users/entities/user.entity';

@WebSocketGateway({ namespace: '/docs' })
export class DocsGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly docsService: DocsService) {}

  @SubscribeMessage('join')
  join(@ConnectedSocket() client: Socket, @MessageBody('documentId') id: string) {
    client.join(`doc:${id}`);
  }

  @SubscribeMessage('edit')
  async edit(@MessageBody() body, @ConnectedSocket() client: Socket) {
    const doc = await this.docsService.applyOps(
      body.documentId,
      { id: body.userId } as User,
      body.ops,
    );
    client.to(`doc:${body.documentId}`).emit('updated', doc);
    return doc;
  }

  @SubscribeMessage('cursor')
  async cursor(@MessageBody() body) {
    await this.docsService.updateCursor(
      body.documentId,
      { id: body.userId } as User,
      body.position,
    );
    this.server.to(`doc:${body.documentId}`).emit('cursor', body);
  }
}