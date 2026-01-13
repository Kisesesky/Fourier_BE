// src/modules/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './gateways/chat.gateway';
import { DmRoom } from './entities/dm-room.entity';
import { DmMessage } from './entities/dm-message.entity';
import { Channel } from './entities/channel.entity';
import { ChannelMessage } from './entities/channel-message.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { User } from '../users/entities/user.entity';
import { AppConfigModule } from 'src/config/app/config.module';
import { ChatController } from './chat.controller';
import { MessageFile } from './entities/message-file.entity';
import { FilesModule } from '../files/files.module';
import { MessageReaction } from './entities/message-reaction.entity';
import { ThreadRead } from './entities/thread-read.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DmRoom, DmMessage, Channel, ChannelMessage, ProjectMember, User, MessageFile, MessageReaction, ThreadRead]),
    AppConfigModule,
    FilesModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}