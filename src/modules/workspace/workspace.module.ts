// src/modules/workspace/workspace.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([Workspace, WorkspaceMember]),
    forwardRef(() => ChatModule),
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
