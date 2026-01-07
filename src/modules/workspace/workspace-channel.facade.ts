// src/modules/workspace/workspace-channel.facade.ts
import { Injectable } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { ChannelService } from '../channel/channel.service';
import { ChannelChatService } from '../chat/channel-chat.service';

@Injectable()
export class WorkspaceChannelFacade {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly channelService: ChannelService,
    private readonly channelChatService: ChannelChatService,
  ) {}

  async getWorkspaceChannelsMeta(workspaceId: string, userId: string) {
    // 1. 워크스페이스 멤버 확인
    await this.workspaceService.verifyWorkspaceMember(workspaceId, userId);
    // 2. 유저가 속한 채널
    const channels = await this.channelService.getChannelsByWorkspace(
      workspaceId,
      userId,
    );

    // 3. 메타 결합
    return Promise.all(
      channels.map(async (channel) => {
        const meta = await this.channelChatService.getChannelMeta(
          channel.id,
          userId,
        );

        return {
          channelId: channel.id,
          name: channel.name,
          isPrivate: channel.isPrivate,
          unreadCount: meta.unreadCount,
          lastMessage: meta.lastMessage,
          lastMessageAt: meta.lastMessageAt,
        };
      }),
    );
  }
}