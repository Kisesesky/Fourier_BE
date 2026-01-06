// src/modules/workspace/entities/workspace.entity.ts
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { WorkSpaceMember } from "./workspace-member.entity";
import { Channel } from "./channel.entity";

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

  @OneToMany(() => WorkSpaceMember, (wm) => wm.workspace)
  members: WorkSpaceMember[];

  @OneToMany(() => Channel, (channel) => channel.workspace)
  channels: Channel[];
}
