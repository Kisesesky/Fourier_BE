// src/modules/workspace/workspace.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { User } from '../users/entities/user.entity';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  async createDefaultWorkspace(user: User) {
    const workspace = this.workspaceRepository.create({
      name: `${user.displayName ?? user.name}'s Workspace`,
      createdBy: { id: user.id } as User,
    });

    return this.workspaceRepository.save(workspace);
  }

  async getMyWorkspace(user: User): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findOne({
      where: { createdBy: { id: user.id } },
      relations: ['teams'],
    });
    if (!workspace) {
      throw new NotFoundException('워크스페이스가 없습니다.');
    }

    return {
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
    };
  }
}