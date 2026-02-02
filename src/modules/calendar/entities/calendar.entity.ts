import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Project } from 'src/modules/projects/entities/project.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CalendarType } from '../constants/calendar-type.enum';
import { CalendarCategory } from './calendar-category.entity';
import { CalendarMember } from './calendar-member.entity';
import { CalendarFolder } from './calendar-folder.entity';

@Entity()
export class Calendar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CalendarType, default: CalendarType.TEAM })
  type: CalendarType;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  owner?: User | null;

  @ManyToOne(() => CalendarFolder, (folder) => folder.calendars, { onDelete: 'SET NULL', nullable: true })
  folder?: CalendarFolder | null;

  @Column({ default: '#3b82f6' })
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => CalendarCategory, (category) => category.calendar)
  categories: CalendarCategory[];

  @OneToMany(() => CalendarMember, (member) => member.calendar)
  members: CalendarMember[];
}
