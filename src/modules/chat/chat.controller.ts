import { Controller, Post, Param, UseGuards, Body, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { SendMessageDto } from './dto/send-message.dto';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  
  @ApiOperation({ summary: '채팅방 생성' })
  @Post(':targetId')
  createOrGetRoom(
    @RequestUser() user: User,
    @Param('targetId') targetId: string
  ) {
    return this.chatService.getOrCreateRoom(user.id, targetId);
  }

  @ApiOperation({ summary: '메세지 보내기' })
  @Post(':roomId/messages')
  sendMessage(
    @RequestUser() user: User,
    @Param('roomId') roomId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(roomId, user.id, sendMessageDto.content);
  }

  @ApiOperation({ summary: '내 채팅방 찾기' })
  @Get('room')
  getMyRooms(@RequestUser() user: User) {
    return this.chatService.getMyRooms(user.id)
  }

  @ApiOperation({ summary: '내 채팅 찾기' })
  @Get('message')
  getMyChats(@RequestUser() user: User) {
    return this.chatService.getMyChats(user.id)
  }

  @ApiOperation({ summary: '메세지 목록 조회' })
  @Get(':roomId/messages')
  getMessages(
    @RequestUser() user: User,
    @Param('roomId') roomId: string,
    @Query('cursor') cursor? : string,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(
      roomId,
      user.id,
      Number(limit) || 20,
      cursor,
    )
  }
}
