// src/modules/chat/chat.controller.ts
import { Controller, Get, Post,  Body, Query, UseGuards } from '@nestjs/common';
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

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService
  ) {}

  @ApiOperation({ summary: '채널에서 메시지 보내기'})
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('channel/message')
  async sendChannelMessage(
    @RequestUser() user: User,
    @Body() sendChannelMessageDto: SendChannelMessageDto
  ) {
    return this.chatService.sendChannelMessage(user, sendChannelMessageDto);
  }

  @ApiOperation({ summary: '채널에서 메세지 목록'})
  @ApiOkResponse({ type: [MessageResponseDto] })
  @Get('channel/messages')
  async getChannelMessages(
    @RequestUser() user: User,
    @Query() getChannelMessagesDto: GetChannelMessagesDto
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getChannelMessages(getChannelMessagesDto.channelId, user, getChannelMessagesDto.limit, getChannelMessagesDto.cursor);
  }

  @ApiOperation({ summary: '채널 읽음 처리' })
  @Post('channel/read')
  async readChannel(
    @RequestUser() user: User,
    @Body() readChannelMessageDto: ReadChannelMessageDto,
  ) {
    await this.chatService.markChannelRead(readChannelMessageDto.channelId, user);
    return { success: true };
  }

  @ApiOperation({ summary: '채널 unread 수' })
  @Get('channel/unread')
  async getChannelUnread(
    @RequestUser() user: User,
    @Query() unreadCountDto: UnreadCountDto,
  ) {
    return {
      count: await this.chatService.getChannelUnreadCount(
        unreadCountDto.id,
        user.id,
      ),
    };
  }

  @ApiOperation({ summary: '메시지 보내기'})
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('dm/message')
  async sendDmMessage(
    @RequestUser() user: User,
    @Body() sendDmMessageDto: SendDmMessageDto
  ) {
    return this.chatService.sendDM(user, sendDmMessageDto);
  }

  @ApiOperation({ summary: '메시지 가져오기'})
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
      count: await this.chatService.getDmUnreadCount(
        unreadCountDto.id,
        user.id,
      ),
    };
  }

  @Get('messages/context')
  getMessageContext(
    @RequestUser() user: User,
    @Query() dto: GetMessageContextDto,
  ) {
    return this.chatService.getMessageContext(user, dto);
  }
}