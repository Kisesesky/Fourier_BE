// src/modules/workspace/entities/workspace-member.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Unique } from 'typeorm';
import { Workspace } from './workspace.entity';
import { User } from '../../users/entities/user.entity';
import { WorkspaceRole } from '../constants/workspace-role.enum';

@Entity()
@Unique(['workspace', 'user'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.members, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  role: WorkspaceRole;

  @CreateDateColumn()
  joinedAt: Date;
}
