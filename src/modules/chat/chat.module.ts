// src/modules/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './gateways/chat.gateway';
import { DmRoom } from './entities/dm-room.entity';
import { DmMessage } from './entities/dm-message.entity';
import { Channel } from './entities/channel.entity';
import { ChannelMessage } from './entities/channel-message.entity';
import { User } from '../users/entities/user.entity';
import { AppConfigModule } from 'src/config/app/config.module';
import { ChatController } from './chat.controller';
import { MessageFile } from './entities/message-file.entity';
import { FilesModule } from '../files/files.module';
import { MessageReaction } from './entities/message-reaction.entity';
import { ThreadRead } from './entities/thread-read.entity';
import { ChannelRead } from './entities/channel-read.entity';
import { DmRead } from './entities/dm-read.entity';
import { MessageSearch } from './entities/message-search.entity';
import { ChannelPinnedMessage } from './entities/channel-pinned-message.entity';
import { SavedMessage } from './entities/saved-message.entity';
import { LinkPreview } from './entities/link-preview.entity';
import { LinkPreviewService } from './services/link-preview.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      DmRoom,
      DmMessage,
      DmRead,
      Channel,
      ChannelMessage,
      ChannelRead,
      ChannelPinnedMessage,
      ThreadRead,
      MessageFile,
      MessageReaction,
      MessageSearch,
      SavedMessage,
      LinkPreview,
    ]),
    AppConfigModule,
    FilesModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, LinkPreviewService],
  exports: [ChatService],
})
export class ChatModule {}