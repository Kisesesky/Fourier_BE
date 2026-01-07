import { forwardRef, Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { Workspace } from './entities/workspace.entity';
import { ChannelModule } from '../channel/channel.module';
import { WorkspaceChannelFacade } from './workspace-channel.facade';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([WorkspaceMember, Workspace]),
    ChatModule,
    ChannelModule,
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspaceChannelFacade],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
