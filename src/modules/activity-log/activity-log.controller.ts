// src/modules/activity-log/activity-log.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityLogService } from './activity-log.service';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('team/:teamId/project/:projectId/activity')
export class ActivityLogController {
  constructor(
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get()
  getTimeline(
    @Param('projectId') projectId: string,
    @RequestUser() user: User,
  ) {
    return this.activityLogService.getProjectTimeline(projectId, user);
  }
}