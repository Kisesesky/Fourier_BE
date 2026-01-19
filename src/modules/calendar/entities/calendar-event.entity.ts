// src/modules/calendar/entities/calendar-event.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Project } from 'src/modules/projects/entities/project.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CalendarCategory } from './calendar-category.entity';

@Entity()
export class CalendarEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.events, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  createdBy?: User;

  @Column()
  title: string;

  @ManyToOne(() => CalendarCategory, { eager: true })
  category: CalendarCategory;

  @Column({ type: 'timestamp' })
  startAt: Date;

  @Column({ type: 'timestamp' })
  endAt: Date;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true, type: 'text' })
  memo?: string;

  @Index()
  @Column({ nullable: true })
  linkedIssueId?: string;

  @Column({ default: 'manual' })
  sourceType: 'manual' | 'issue';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}