// src/modules/chat/chat.controller.ts
import { Controller, Get, Post,  Body, Query, UseGuards, Patch, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { SendChannelMessageDto } from './dto/send-channel-message.dto';
import { SendDmMessageDto } from './dto/send-dm-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { GetChannelMessagesDto } from './dto/get-channel-message.dto';
import { GetDmMessagesDto } from './dto/get-dm-messages.dto';
import { ReadChannelMessageDto } from './dto/read-channel-message.dto';
import { UnreadCountDto } from './dto/unread-count.dto';
import { ReadDmMessageDto } from './dto/read-dm-message.dto';
import { GetMessageContextDto } from './dto/get-message-context.dto';
import { mapMessageToResponse } from './utils/message.mapper';
import { SendThreadMessageDto } from './dto/send-thread-message.dto';
import { CreateDmRoomDto } from './dto/create-dm-room.dto';
import { ChatGateway } from './gateways/chat.gateway';
import { GetChannelPreferencesDto, SaveChannelPreferencesDto } from './dto/channel-preferences.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdatePresenceStatusDto } from './dto/update-presence-status.dto';
import { ChannelType } from './constants/channel-type.enum';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @ApiOperation({ summary: '채널에서 메시지 보내기'})
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('channel/message')
  async sendChannelMessage(
    @RequestUser() user: User,
    @Body() sendChannelMessageDto: SendChannelMessageDto
  ) {
    const message = await this.chatService.sendChannelMessage(user, sendChannelMessageDto);
    const mapped = mapMessageToResponse(message, user.id);
    this.chatGateway.emitChannelMessageCreated(sendChannelMessageDto.channelId, mapped);
    return mapped;
  }

  @ApiOperation({ summary: '채널에서 메시지 목록'})
  @ApiOkResponse({ type: [MessageResponseDto] })
  @Get('channel/messages')
  async getChannelMessages(
    @RequestUser() user: User,
    @Query() getChannelMessagesDto: GetChannelMessagesDto
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getChannelMessages(getChannelMessagesDto.channelId, user, getChannelMessagesDto.limit, getChannelMessagesDto.cursor);
  }

  @ApiOperation({ summary: '채널 메시지 읽음 처리' })
  @Post('channel/read')
  async readChannel(
    @RequestUser() user: User,
    @Body() readChannelMessageDto: ReadChannelMessageDto,
  ) {
    await this.chatService.markChannelRead(readChannelMessageDto.channelId, user);
    return { success: true };
  }

  @ApiOperation({ summary: '채널 메시지 unread 수' })
  @Get('channel/unread')
  async getChannelUnread(
    @RequestUser() user: User,
    @Query() unreadCountDto: UnreadCountDto,
  ) {
    return {
      count: await this.chatService.getChannelUnreadCount(unreadCountDto.id, user.id)
    };
  }

  @ApiOperation({ summary: '채널 핀 메시지 목록' })
  @Get('channel/pins')
  async getChannelPins(
    @RequestUser() user: User,
    @Query('channelId') channelId: string,
  ) {
    const pins = await this.chatService.getPinnedMessages(channelId);
    return { messageIds: pins.map((p) => p.message.id) };
  }

  @ApiOperation({ summary: 'DM 보내기'})
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('dm/message')
  async sendDmMessage(
    @RequestUser() user: User,
    @Body() sendDmMessageDto: SendDmMessageDto
  ) {
    return mapMessageToResponse(
      await this.chatService.sendDM(user, sendDmMessageDto),
      user.id,
    );
  }

  @ApiOperation({ summary: 'DM 룸 생성/조회' })
  @Post('dm/room')
  async getOrCreateDmRoom(
    @RequestUser() user: User,
    @Body() createDmRoomDto: CreateDmRoomDto,
  ) {
    const filtered = createDmRoomDto.userIds.filter((id) => id !== user.id);
    const room = await this.chatService.getOrCreateDmRoom(filtered, user);
    return { id: room.id };
  }

  @ApiOperation({ summary: 'DM 메시지 목록'})
  @ApiOkResponse({ type: [MessageResponseDto] })
  @Get('dm/messages')
  async getDmMessages(
    @RequestUser() user: User,
    @Query() getDmMessagesDto: GetDmMessagesDto
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getDmMessages(getDmMessagesDto.roomId, user, getDmMessagesDto.limit, getDmMessagesDto.cursor);
  }

  @ApiOperation({ summary: 'DM 읽음 처리' })
  @Post('dm/read')
  async readDm(
    @RequestUser() user: User,
    @Body() readDmMessageDto: ReadDmMessageDto,
  ) {
    await this.chatService.markDmRead(readDmMessageDto.roomId, user);
    return { success: true };
  }

  @ApiOperation({ summary: 'DM unread 수' })
  @Get('dm/unread')
  async getDmUnread(
    @RequestUser() user: User,
    @Query() unreadCountDto: UnreadCountDto,
  ) {
    return {
      count: await this.chatService.getDmUnreadCount(unreadCountDto.id, user.id)
    };
  }

  @ApiOperation({ summary: '스레드 메시지 목록' })
  @ApiOkResponse({ type: [MessageResponseDto] })
  @Get('thread/messages')
  async getThreadMessages(
    @RequestUser() user: User,
    @Query('parentMessageId') parentMessageId: string
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getThreadMessages(parentMessageId, user);
  }

  @ApiOperation({ summary: '스레드 메시지 보내기' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('thread/message')
  async sendThreadMessage(
    @RequestUser() user: User,
    @Body() sendThreadMessageDto: SendThreadMessageDto,
  ): Promise<MessageResponseDto> {
    const reply = await this.chatService.sendThreadMessage(
      user,
      sendThreadMessageDto.threadParentId,
      sendThreadMessageDto.content,
      sendThreadMessageDto.fileIds ?? []
    );
    const mapped = mapMessageToResponse(reply, user.id);

    const scopedParent = await this.chatService.findScopedMessageById(sendThreadMessageDto.threadParentId);
    if (scopedParent.scope === 'CHANNEL') {
      const parentMessage = scopedParent.message as any;
      const channelId = parentMessage.channel?.id;
      if (channelId) {
        this.chatGateway.emitThreadCreated(channelId, {
          parentMessageId: sendThreadMessageDto.threadParentId,
          message: mapped,
        });
        const unreadCount = await this.chatService.getThreadUnreadCount(sendThreadMessageDto.threadParentId, user.id);
        this.chatGateway.emitThreadMeta(channelId, {
          parentMessageId: sendThreadMessageDto.threadParentId,
          thread: {
            replyCount: parentMessage.threadCount,
            unreadCount,
            lastReplyAt: parentMessage.lastThreadAt,
          },
        });
      }
    }

    return mapped;
  }

  @ApiOperation({ summary: '메시지 컨텍스트 조회' })
  @Get('messages/context')
  getMessageContext(
    @RequestUser() user: User,
    @Query() getMessageContextDto: GetMessageContextDto,
  ) {
    return this.chatService.getMessageContext(user, getMessageContextDto);
  }

  @ApiOperation({ summary: '저장한 메시지 목록' })
  @Get('messages/saved')
  async getSavedMessages(
    @RequestUser() user: User,
  ) {
    const saved = await this.chatService.getSavedMessages(user);
    return {
      messageIds: saved
        .map((s) => s.channelMessage?.id || s.dmMessage?.id)
        .filter(Boolean),
    };
  }

  @ApiOperation({ summary: '온라인 유저 목록' })
  @Get('presence')
  async getPresence() {
    return this.chatGateway.getPresenceSnapshot();
  }

  @ApiOperation({ summary: '프리즌스 상태 변경' })
  @Patch('presence/status')
  async updatePresence(
    @RequestUser() user: User,
    @Body() updatePresenceStatusDto: UpdatePresenceStatusDto,
  ) {
    this.chatGateway.setUserPresence(user.id, updatePresenceStatusDto.status);
    return { success: true };
  }

  @ApiOperation({ summary: '프로젝트 채널 목록' })
  @Get('channels')
  async getChannels(
    @RequestUser() user: User,
    @Query('projectId') projectId: string,
  ) {
    const channels = await this.chatService.getProjectChannels(projectId, user.id);
    return channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      projectId,
      isDefault: channel.isDefault,
      type: channel.type ?? ChannelType.CHAT,
    }));
  }

  @ApiOperation({ summary: '메시지 분석 집계' })
  @Get('analytics/messages')
  async getMessageAnalytics(
    @RequestUser() user: User,
    @Query('projectId') projectId: string,
    @Query('granularity') granularity: 'hourly' | 'daily' | 'monthly',
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!granularity) {
      throw new BadRequestException('granularity is required');
    }
    return this.chatService.getMessageAnalytics(projectId, user.id, {
      granularity,
      date,
      month,
      year,
    });
  }

  @ApiOperation({ summary: '프로젝트 채널 생성' })
  @Post('channels')
  async createChannel(
    @RequestUser() user: User,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    const { channel, memberIds } = await this.chatService.createChannel(
      createChannelDto.projectId,
      user,
      createChannelDto.name,
      createChannelDto.memberIds ?? [],
      createChannelDto.type ?? ChannelType.CHAT,
    );
    return {
      id: channel.id,
      name: channel.name,
      projectId: createChannelDto.projectId,
      isDefault: channel.isDefault,
      type: channel.type ?? ChannelType.CHAT,
      memberIds,
    };
  }

  @ApiOperation({ summary: '채널 뷰/보관/핀 선호도 조회' })
  @Get('channel/preferences')
  async getChannelPreferences(
    @RequestUser() user: User,
    @Query() getChannelPreferencesDto: GetChannelPreferencesDto,
  ) {
    return this.chatService.getChannelPreferences(getChannelPreferencesDto.projectId, user);
  }

  @ApiOperation({ summary: '채널 뷰/보관/핀 선호도 저장' })
  @Post('channel/preferences')
  async saveChannelPreferences(
    @RequestUser() user: User,
    @Body() saveChannelPreferencesDto: SaveChannelPreferencesDto,
  ) {
    const saved = await this.chatService.saveChannelPreferences(
      saveChannelPreferencesDto.projectId,
      user,
      {
        pinnedChannelIds: saveChannelPreferencesDto.pinnedChannelIds,
        archivedChannelIds: saveChannelPreferencesDto.archivedChannelIds,
      },
    );
    return {
      pinnedChannelIds: saved.pinnedChannelIds ?? [],
      archivedChannelIds: saved.archivedChannelIds ?? [],
    };
  }
}
