// src/modules/chat/chat.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { UsersModule } from '../users/users.module';
import { MembersModule } from '../members/members.module';
import { ChannelMessage } from './entities/channel-message.entity';
import { ChannelChatService } from './channel-chat.service';
import { Channel } from '../channel/entities/channel.entity';
import { ChannelMember } from '../channel/entities/channel-member.entity';
import { AuthModule } from '../auth/auth.module';
import { ChannelModule } from '../channel/channel.module';
import { ChannelGateway } from './gateways/channel.gateway';
import { MessageGateway } from './gateways/message.gateway';
import { WorkspaceModule } from '../workspace/workspace.module';
import { GatewayService } from './gateways/gateway.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, ChatMessage, Channel, ChannelMessage, ChannelMember]),
    UsersModule,
    MembersModule,
    AuthModule,
    forwardRef(() => ChannelModule),
    forwardRef(() => WorkspaceModule),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChannelChatService, GatewayService, ChannelGateway, MessageGateway],
  exports: [ChatService, ChannelChatService, GatewayService],
})
export class ChatModule {}
