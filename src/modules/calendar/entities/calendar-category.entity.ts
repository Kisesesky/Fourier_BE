// src/modules/calendar/entities/calendar-category.entity.ts
import { Project } from "src/modules/projects/entities/project.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from "typeorm";

@Entity()
export class CalendarCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

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