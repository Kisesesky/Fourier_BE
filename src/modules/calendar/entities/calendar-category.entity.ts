// src/modules/calendar/entities/calendar-category.entity.ts
import { Project } from "src/modules/projects/entities/project.entity";
import { Calendar } from "./calendar.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from "typeorm";

@Entity()
export class CalendarCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => Calendar, (calendar) => calendar.categories, { onDelete: 'CASCADE', nullable: true })
  calendar: Calendar;

  @Column()
  name: string;

  @Column({ default: '#3788d8' })
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean

  @CreateDateColumn()
  createdAt: Date;
}
