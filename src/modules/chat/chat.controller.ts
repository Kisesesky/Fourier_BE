// src/modules/chat/chat.controller.ts
import { Controller, Get, Post,  Body, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { SendChannelMessageDto } from './dto/send-channel-message.dto';
import { SendDmMessageDto } from './dto/send-dm-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageResponseDto } from './dto/message-response.dto';

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
    @Query() getMessagesDto: GetMessagesDto
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getChannelMessages(getMessagesDto.id, user, getMessagesDto.limit, getMessagesDto.cursor);
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
    @Query() getMessagesDto: GetMessagesDto
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getDmMessages(getMessagesDto.id, user, getMessagesDto.limit, getMessagesDto.cursor);
  }
}