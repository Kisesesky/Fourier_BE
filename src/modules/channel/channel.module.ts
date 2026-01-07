import { forwardRef, Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { UsersModule } from '../users/users.module';
import { WorkspaceMember } from '../workspace/entities/workspace-member.entity';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports:[
      TypeOrmModule.forFeature([Channel, ChannelMember]),
    ],
  controllers: [ChannelController],
  providers: [ChannelService],
  exports: [ChannelService],
})
export class ChannelModule {}
