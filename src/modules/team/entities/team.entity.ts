// src/modules/team/entities/team.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { TeamMember } from './team-member.entity';
import { Project } from 'src/modules/projects/entities/project.entity';
import { IconType } from 'src/common/constants/icon-type';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: IconType, default: IconType.EMOJI })
  iconType: IconType;

  @Column({ nullable: true })
  iconValue?: string; 

  @ManyToOne(() => Workspace, (workspace) => workspace.teams, { onDelete: 'CASCADE' })
  workspace: Workspace;

  @OneToMany(() => TeamMember, (member) => member.team)
  members: TeamMember[];

  @OneToMany(() => Project, (project) => project.team)
  projects: Project[];

  @CreateDateColumn()
  createdAt: Date;
}