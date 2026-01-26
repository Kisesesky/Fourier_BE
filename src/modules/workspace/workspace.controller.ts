// src/modules/workspace/workspace.controller.ts
import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';


@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiTags('workspace')
@Controller('workspace')
export class WorkspaceController {
  
  constructor(
    private readonly workspaceService: WorkspaceService
  ) {}

  @ApiOperation({ summary: '내 워크스페이스 찾기' })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  @Get('me')
  getMyWorkspace(
    @RequestUser() user: User
  ) {
    return this.workspaceService.getMyWorkspace(user);
  }

  @ApiOperation({ summary: '내 워크스페이스 목록' })
  @ApiOkResponse({ type: [WorkspaceResponseDto] })
  @Get('my')
  getMyWorkspaces(
    @RequestUser() user: User
  ) {
    return this.workspaceService.getMyWorkspaces(user);
  }
}
