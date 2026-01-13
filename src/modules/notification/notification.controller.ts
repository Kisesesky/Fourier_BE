import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '@nestjs/passport';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { NotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: '내 알람 목록'})
  @ApiOkResponse({
    description: '알림 목록',
    type: NotificationResponseDto,
    isArray: true,
  })
  @Get()
  getMy(
    @RequestUser() user: User
  ) {
    return this.notificationService.getMyNotifications(user.id);
  }

  @ApiOperation({ summary: '알람 읽음 처리'})
  @ApiParam({
    name: 'id',
    description: '알림 ID',
    example: 'notification-uuid',
  })
  @Patch(':id/read')
  async markRead(
    @Param('id') id: string,
    @RequestUser() user: User
  ) {
    await this.notificationService.markRead(id, user.id);
    return { success: true };
  }

  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  @Patch('read-all')
  async markAllRead(
    @RequestUser() user: User
  ) {
    await this.notificationService.markAllRead(user.id);
    return { success: true };
  }
}