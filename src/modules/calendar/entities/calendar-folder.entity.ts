import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Project } from 'src/modules/projects/entities/project.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Calendar } from './calendar.entity';

@Entity()
export class CalendarFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  name: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  createdBy?: User | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Calendar, (calendar) => calendar.folder)
  calendars: Calendar[];
}
