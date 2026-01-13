// src/modules/issue/entities/issue.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { IssueComment } from './issue-comment.entity';
import { IssueStatus } from '../constants/issue-status.enum';

@Entity()
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string; // 업무명

  @ManyToOne(() => User, { nullable: true })
  assignee?: User;

  @Column({ type: 'enum', enum: IssueStatus, default: IssueStatus.PLANNED })
  status: IssueStatus;

  @Column({ type: 'int', default: 0 })
  progress: number; // 0 ~ 100%

  @Column({ type: 'date', nullable: true })
  startAt?: Date;

  @Column({ type: 'date', nullable: true })
  endAt?: Date;

  @ManyToOne(() => User)
  creator: User;

  @ManyToOne(() => Project, (project) => project.issues, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => Issue, (issue) => issue.subtasks, { nullable: true, onDelete: 'CASCADE' })
  parent?: Issue;

  @OneToMany(() => Issue, (issue) => issue.parent)
  subtasks: Issue[];

  @OneToMany(() => IssueComment, (comment) => comment.issue)
  comments: IssueComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}