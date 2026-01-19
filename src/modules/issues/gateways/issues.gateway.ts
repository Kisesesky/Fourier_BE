// src/modules/issue/issue.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IssuesService } from '../issues.service';
import { WsUpdateProgressDto } from '../dto/ws-update-progress.dto';
import { WsUpdateStatusDto } from '../dto/ws-update-status.dto';
import { WsAddSubtaskDto } from '../dto/ws-add-subtask.dto';
import { WsRemoveSubtaskDto } from '../dto/ws-remove-subtask.dto';
import { User } from 'src/modules/users/entities/user.entity';

@WebSocketGateway({ namespace: '/issue', cors: { origin: true } })
export class IssuesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private onlineUsers = new Map<string, string>();

  constructor(private readonly issuesService: IssuesService) {}

  /** 연결 */
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }
    this.onlineUsers.set(userId, client.id);
    console.log(`User ${userId} connected: ${client.id}`);
  }

  /** 연결 해제 */
  handleDisconnect(client: Socket) {
    const entry = Array.from(this.onlineUsers.entries()).find(([_, id]) => id === client.id);
    if (entry) {
      this.onlineUsers.delete(entry[0]);
      console.log(`User ${entry} disconnected`);
    }
  }

  /** 하위 업무 추가 */
  @SubscribeMessage('add-subtask')
  async handleAddSubtask(
    @MessageBody() body: WsAddSubtaskDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    const user = { id: userId } as User;
    const subtask = await this.issuesService.addSubtask(body, user);
    this.server.emit('subtask-added', subtask);
    return subtask;
  }

  /** 하위 업무 삭제 */
  @SubscribeMessage('remove-subtask')
  async handleRemoveSubtask(
    @MessageBody() body: WsRemoveSubtaskDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    const user = { id: userId } as User;
    const removed = await this.issuesService.removeSubtask(body.subtaskId, user);
    this.server.emit('subtask-removed', removed);
    return removed;
  }

  /** 진행률 실시간 업데이트 */
  @SubscribeMessage('update-progress')
  async handleUpdateProgress(@
    MessageBody() body: WsUpdateProgressDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    const user = { id: userId } as User;
    const updatedIssue = await this.issuesService.updateProgress(
      body.issueId,
      { progress: body.progress },
      user,
    );
    this.server.emit('progress-updated', {
      issueId: updatedIssue.id,
      progress: updatedIssue.progress,
    });
  }

  /** 상태 변경 */
  @SubscribeMessage('update-status')
  async handleUpdateStatus(
    @MessageBody() body: WsUpdateStatusDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    const user = { id: userId } as User;
    await this.issuesService.updateStatus(body.issueId, body.status, user);

    const updatedIssue = await this.issuesService.getIssueById(body.issueId);
    this.server.emit('status-updated', {
      issueId: updatedIssue.id,
      status: updatedIssue.status,
    });
  }

  /** 담당자 지정 */
  @SubscribeMessage('assign-issue')
  async handleAssignIssue(
    @MessageBody() body: { issueId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const actorId = client.handshake.query.userId as string;
    if (!actorId) return;

    const actor = { id: actorId } as User;
    const updatedIssue = await this.issuesService.assignIssue(
      body.issueId,
      body.userId,
      actor,
    );

    this.server.emit('issue-assigned', {
      issueId: updatedIssue.id,
      assignee: updatedIssue.assignee,
    });
  }
}