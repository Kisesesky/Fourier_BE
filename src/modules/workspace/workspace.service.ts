// src/modules/workspace/workspace.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { User } from '../users/entities/user.entity';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceRole } from './constants/workspace-role.enum';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}

  async createDefaultWorkspace(user: User) {
    const workspace = this.workspaceRepository.create({
      name: `${user.displayName ?? user.name}'s Workspace`,
      createdBy: { id: user.id } as User,
    });

    const savedWorkspace = await this.workspaceRepository.save(workspace);
    await this.workspaceMemberRepository.save(
      this.workspaceMemberRepository.create({
        workspace: { id: savedWorkspace.id } as Workspace,
        user: { id: user.id } as User,
        role: WorkspaceRole.OWNER,
      }),
    );
    return savedWorkspace;
  }

  async getMyWorkspace(user: User): Promise<WorkspaceResponseDto> {
    const workspaces = await this.getMyWorkspaces(user);
    const workspaceByMember = workspaces[0] ?? null;

    let workspace = workspaceByMember;
    if (!workspace) {
      workspace = await this.workspaceRepository.findOne({
        where: { createdBy: { id: user.id } },
      });
      if (workspace) {
        const exists = await this.workspaceMemberRepository.findOne({
          where: { workspace: { id: workspace.id }, user: { id: user.id } },
        });
        if (!exists) {
          await this.workspaceMemberRepository.save(
            this.workspaceMemberRepository.create({
              workspace: { id: workspace.id } as Workspace,
              user: { id: user.id } as User,
              role: WorkspaceRole.OWNER,
            }),
          );
        }
      }
    }
    if (!workspace) {
      throw new NotFoundException('워크스페이스가 없습니다.');
    }

    return {
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
    };
  }

  async getMyWorkspaces(user: User): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .innerJoin('workspace.members', 'member')
      .where('member.userId = :userId', { userId: user.id })
      .orderBy('member.joinedAt', 'DESC')
      .getMany();

    if (workspaces.length === 0) {
      const fallback = await this.workspaceRepository.findOne({
        where: { createdBy: { id: user.id } },
      });
      if (fallback) {
        const exists = await this.workspaceMemberRepository.findOne({
          where: { workspace: { id: fallback.id }, user: { id: user.id } },
        });
        if (!exists) {
          await this.workspaceMemberRepository.save(
            this.workspaceMemberRepository.create({
              workspace: { id: fallback.id } as Workspace,
              user: { id: user.id } as User,
              role: WorkspaceRole.OWNER,
            }),
          );
        }
        return [
          {
            id: fallback.id,
            name: fallback.name,
            createdAt: fallback.createdAt,
          },
        ];
      }
    }

    return workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
    }));
  }
}
