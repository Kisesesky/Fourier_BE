// src/modules/mention/mention.controller.ts
import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { MentionService } from './mention.service';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { MentionTargetType } from './constants/mention-target-type.enum';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('mentions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class MentionController {
  constructor(
    private readonly mentionService: MentionService,
  ) {}

  @Get('me')
  getMyMentions(@RequestUser() user: User) {
    return this.mentionService.getMyMentions(user);
  }

  @Patch(':id/read')
  markRead(
    @Param('id') id: string,
    @RequestUser() user: User,
  ) {
    return this.mentionService.markAsRead(id, user);
  }

  @Get('mentions/preview')
  getPreview(
    @Query('type') type: MentionTargetType,
    @Query('id') id: string,
  ) {
    return this.mentionService.getPreview(type, id);
  }
}