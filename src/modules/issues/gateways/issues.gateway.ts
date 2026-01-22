// src/modules/issue/issue.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IssuesService } from '../issues.service';
import { WsUpdateProgressDto } from '../dto/ws-update-progress.dto';
import { WsUpdateStatusDto } from '../dto/ws-update-status.dto';
import { WsAddSubtaskDto } from '../dto/ws-add-subtask.dto';
import { WsRemoveSubtaskDto } from '../dto/ws-remove-subtask.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { mapIssuesToResponse } from '../utils/issues.mapper';

@WebSocketGateway({ namespace: '/issue', cors: { origin: true } })
export class IssuesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private onlineUsers = new Map<string, string>();

  constructor(
    private readonly issuesService: IssuesService,
  ) {}

  /** 연결 */
  async handleConnection(client: Socket) {
  try {
    const token = client.handshake.auth?.token;
    if (!token) return client.disconnect();

    const user = await this.issuesService.verifyToken(token);
    if (!user) return client.disconnect();

    client.data.user = user;
    console.log(`Issue WS connected: ${user.id}`);
  } catch (e) {
    client.disconnect();
  }
}

  /** 연결 해제 */
  handleDisconnect(client: Socket) {
    const entry = Array.from(this.onlineUsers.entries()).find(([_, id]) => id === client.id);
    if (entry) {
      this.onlineUsers.delete(entry[0]);
      console.log(`User ${entry} disconnected`);
    }
  }

  private getUser(client: Socket): User {
    const user = client.data.user as User;
    if (!user) {
      throw new Error('WS user not found');
    }
    return user;
  }

  @SubscribeMessage('add-subtask')
  async handleAddSubtask(
    @MessageBody() body: WsAddSubtaskDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.getUser(client);
    const saved = await this.issuesService.addSubtask(body, user);
    const fullIssue = await this.issuesService.getIssueById(saved.id);

    const payload = mapIssuesToResponse(fullIssue);

    this.server.emit('subtask-added', payload);
    return payload;
  }

  @SubscribeMessage('remove-subtask')
  async handleRemoveSubtask(
    @MessageBody() body: WsRemoveSubtaskDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.getUser(client);
    const removed = await this.issuesService.removeSubtask(body.subtaskId, user);

    this.server.emit('subtask-removed', removed);
    return removed;
  }

  @SubscribeMessage('update-progress')
  async handleUpdateProgress(
    @MessageBody() body: WsUpdateProgressDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.getUser(client);

    const issue = await this.issuesService.updateProgress(
      body.issueId,
      { progress: body.progress },
      user,
    );

    this.server.emit('progress-updated', {
      issueId: issue.id,
      progress: issue.progress,
    });
  }

  @SubscribeMessage('update-status')
  async handleUpdateStatus(
    @MessageBody() body: WsUpdateStatusDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.getUser(client);

    await this.issuesService.updateStatus(
      body.issueId,
      body.status,
      user,
    );

    this.server.emit('status-updated', {
      issueId: body.issueId,
      status: body.status,
    });
  }

  @SubscribeMessage('assign-issue')
  async handleAssignIssue(
    @MessageBody() body: { issueId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const actor = this.getUser(client);

    const issue = await this.issuesService.assignIssue(
      body.issueId,
      body.userId,
      actor,
    );

    this.server.emit('issue-assigned', {
      issueId: issue.id,
      assignee: issue.assignee,
    });
  }
}