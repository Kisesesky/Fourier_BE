import { Controller, Get, Param, Post } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('channel')
export class ChannelController {
  constructor(
    private readonly channelService: ChannelService,
  ) {}
  
  @Post(':channelId/mute')
  muteChannel(
    @Param('channelId') channelId: string,
    @RequestUser() user: User,
  ) {
    return this.channelService.muteChannel(channelId, user.id);
  }
}
