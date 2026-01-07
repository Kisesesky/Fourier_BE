// src/modules/app-facade/app-facade.module.ts
import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { ChannelModule } from '../channel/channel.module';
import { WorkspaceChannelFacade } from '../workspace/workspace-channel.facade';

@Module({
  imports: [
    ChatModule,
    ChannelModule,
  ],
  providers: [WorkspaceChannelFacade],
  exports: [WorkspaceChannelFacade],
})
export class AppFacadeModule {}