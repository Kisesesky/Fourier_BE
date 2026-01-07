import { Controller, Get, Param } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { WorkspaceChannelFacade } from './workspace-channel.facade';

@Controller('workspace')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceChannelFacade: WorkspaceChannelFacade,
  ) {}

  @Get(':workspaceId/channels')
  async getWorkspaceChannels(
    @RequestUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaceChannelFacade.getWorkspaceChannelsMeta(
      workspaceId,
      user.id,
    )
  }
}
