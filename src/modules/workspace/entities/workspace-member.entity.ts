// src/modules/workspace/entities/workspace-member.entity.ts
import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Workspace } from "./workspace.entity";

export type roleStatus = 'owner' | 'admin' | 'member';

@Entity()
@Unique(['user', 'workspace'])
export class WorkSpaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Workspace, (ws) => ws.members, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @Column({ default: 'member' })
  role: roleStatus;

  @CreateDateColumn()
  joinedAt: Date;
}