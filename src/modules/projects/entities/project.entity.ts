// src/modules/project/entities/project.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Team } from '../../team/entities/team.entity';
import { ProjectMember } from './project-member.entity';
import { IconType } from 'src/common/constants/icon-type';
import { CalendarEvent } from 'src/modules/calendar/entities/calendar-event.entity';
import { Channel } from 'src/modules/chat/entities/channel.entity';
import { Issue } from 'src/modules/issues/entities/issue.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: IconType, default: IconType.EMOJI })
  iconType: IconType;

  @Column({ nullable: true })
  iconValue?: string;

  @ManyToOne(() => Team, (team) => team.projects, { onDelete: 'CASCADE' })
  team: Team;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];

  @OneToMany(() => CalendarEvent, (event) => event.project)
  events: CalendarEvent[];

  @OneToMany(() => Issue, (issue) => issue.project)
  issues: Issue[];

  @OneToMany(() => Channel, (channel) => channel.project)
  channels: Channel[];

  @CreateDateColumn()
  createdAt: Date;
}