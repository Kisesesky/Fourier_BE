// src/modules/issue/issue.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IssueService } from './issues.service';
import { WsUpdateProgressDto } from './dto/ws-update-progress.dto';
import { WsUpdateStatusDto } from './dto/ws-update-status.dto';
import { WsAddSubtaskDto } from './dto/ws-add-subtask.dto';
import { WsRemoveSubtaskDto } from './dto/ws-remove-subtask.dto';

@WebSocketGateway({ namespace: '/issue', cors: { origin: true } })
export class IssueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private onlineUsers = new Map<string, string>();

  constructor(private readonly issueService: IssueService) {}

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
  async handleAddSubtask(@MessageBody() body: WsAddSubtaskDto) {
    const subtask = await this.issueService.addSubtask(body);
    this.server.emit('subtask-added', subtask);
    return subtask;
  }

  /** 하위 업무 삭제 */
  @SubscribeMessage('remove-subtask')
  async handleRemoveSubtask(@MessageBody() body: WsRemoveSubtaskDto) {
    const removed = await this.issueService.removeSubtask(body.subtaskId);
    this.server.emit('subtask-removed', removed);
    return removed;
  }

  /** 진행률 실시간 업데이트 */
  @SubscribeMessage('update-progress')
  async handleUpdateProgress(@MessageBody() body: WsUpdateProgressDto) {
    const updatedIssue = await this.issueService.updateProgress(body.issueId, { progress: body.progress });
    this.server.emit('progress-updated', {
      issueId: updatedIssue.id,
      progress: updatedIssue.progress,
    });
  }

  /** 상태 업데이트 */
  @SubscribeMessage('update-status')
  async handleUpdateStatus(@MessageBody() body: WsUpdateStatusDto) {
    const updated = await this.issueService.updateStatus(body.issueId, body.status);
    this.server.emit('status-updated', { issueId: updated.id, status: updated.status });
  }
}