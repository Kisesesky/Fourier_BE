// src/modules/workspace/entities/workspace-member.entity.ts
import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Workspace } from "./workspace.entity";

export enum WorkspaceMemberRole {
  OWNER ='owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

@Entity()
@Unique(['user', 'workspace'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Workspace, (ws) => ws.members, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @Column({ type: 'enum', enum: WorkspaceMemberRole, default: WorkspaceMemberRole.MEMBER })
  role: WorkspaceMemberRole;

  @CreateDateColumn()
  joinedAt: Date;
}