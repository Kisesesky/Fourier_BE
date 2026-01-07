// src/modules/workspace/entities/workspace.entity.ts
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { WorkspaceMember } from "./workspace-member.entity";
import { Channel } from "../../channel/entities/channel.entity";

@Entity()
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  iconUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => WorkspaceMember, (wm) => wm.workspace)
  members: WorkspaceMember[];

  @OneToMany(() => Channel, (channel) => channel.workspace)
  channels: Channel[];
}
