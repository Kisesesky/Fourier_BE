// src/modules/issue/entities/issue.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { IssueComment } from './issue-comment.entity';
import { IssueStatus } from '../constants/issue-status.enum';
import { IssuePriority } from '../constants/issue-priority.enum';
import { IssueGroup } from './issue-group.entity';

@Entity()
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string; // 업무명

  @ManyToOne(() => User, { nullable: true })
  assignee?: User;

  @Column({ type: 'uuid', nullable: true })
  assigneeId?: string | null;

  @Column({ type: 'enum', enum: IssueStatus, default: IssueStatus.PLANNED })
  status: IssueStatus;

  @Column({ type: 'enum', enum: IssuePriority, default: IssuePriority.MEDIUM })
  priority: IssuePriority;

  @Column({ type: 'int', default: 0 })
  progress: number; // 0 ~ 100%

  @Column({ type: 'date', nullable: true })
  startAt?: Date;

  @Column({ type: 'date', nullable: true })
  endAt?: Date;

  @ManyToOne(() => User)
  creator: User;

  @Column({ type: 'uuid', nullable: false })
  creatorId: string;

  @ManyToOne(() => Project, (project) => project.issues, { onDelete: 'CASCADE' })
  project: Project;

  @Column({ type: 'uuid', nullable: false })
  projectId: string;

  @ManyToOne(() => IssueGroup, (group) => group.issues, { nullable: true, onDelete: 'SET NULL' })
  group?: IssueGroup;

  @Column({ type: 'uuid', nullable: true })
  groupId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'parentId' })
  parentId?: string | null;

  // parent/subtasks are managed in service layer using parentId
  parent?: Issue | null;
  subtasks?: Issue[];

  @OneToMany(() => IssueComment, (comment) => comment.issue)
  comments: IssueComment[];

  @Column({ type: 'timestamp', nullable: true })
  dueAt?: Date;

  @Column({ nullable: true })
  calendarEventId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
