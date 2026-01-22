// src/modules/activity-log/controllers/project-activity.controller.ts
import { Controller, UseGuards, Get, Param } from "@nestjs/common";
import { RequestUser } from "src/common/decorators/request-user.decorator";
import { JwtAuthGuard } from "src/modules/auth/guards/jwt-auth.guard";
import { User } from "src/modules/users/entities/user.entity";
import { ActivityLogService } from "../activity-log.service";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller('projects/:projectId/activity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ProjectActivityController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  getProjectFeed(
    @Param('projectId') projectId: string,
    @RequestUser() user: User,
  ) {
    return this.activityLogService.getProjectFeed(projectId, user);
  }
}