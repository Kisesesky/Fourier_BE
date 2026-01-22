// src/modules/activity-log/controllers/team-activity.controller.ts
import { Controller, UseGuards, Get, Param, Query } from "@nestjs/common";
import { RequestUser } from "src/common/decorators/request-user.decorator";
import { JwtAuthGuard } from "src/modules/auth/guards/jwt-auth.guard";
import { User } from "src/modules/users/entities/user.entity";
import { ActivityLogService } from "../activity-log.service";
import { GetTeamActivityQueryDto } from "../dto/get-team-activity-query.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller('teams/:teamId/activity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class TeamActivityController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  getTeamFeed(
    @Param('teamId') teamId: string,
    @Query() query: GetTeamActivityQueryDto,
    @RequestUser() user: User,
  ) {
    return this.activityLogService.getTeamFeed(teamId, user, query);
  }
}