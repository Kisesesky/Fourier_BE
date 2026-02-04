// src/modules/project/entities/project.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Team } from '../../team/entities/team.entity';
import { ProjectMember } from './project-member.entity';
import { IconType } from 'src/common/constants/icon-type';
import { ProjectStatus } from '../constants/project-status.enum';
import { CalendarEvent } from 'src/modules/calendar/entities/calendar-event.entity';
import { Channel } from 'src/modules/chat/entities/channel.entity';
import { Issue } from 'src/modules/issues/entities/issue.entity';
import { IssueGroup } from 'src/modules/issues/entities/issue-group.entity';
import { ProjectFavorite } from './project-favorite.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: IconType, default: IconType.IMAGE })
  iconType: IconType;

  @Column({ nullable: true })
  iconValue?: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @ManyToOne(() => Team, (team) => team.projects, { onDelete: 'CASCADE' })
  team: Team;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];

  @OneToMany(() => CalendarEvent, (event) => event.project)
  events: CalendarEvent[];

  @OneToMany(() => Issue, (issue) => issue.project)
  issues: Issue[];

  @OneToMany(() => IssueGroup, (group) => group.project)
  issueGroups: IssueGroup[];

  @OneToMany(() => Channel, (channel) => channel.project)
  channels: Channel[];

  @OneToMany(() => ProjectFavorite, (favorite) => favorite.project)
  favorites: ProjectFavorite[];

  @CreateDateColumn()
  createdAt: Date;
}
