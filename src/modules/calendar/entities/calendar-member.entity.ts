import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Calendar } from './calendar.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CalendarMemberRole } from '../constants/calendar-member-role.enum';

@Entity()
export class CalendarMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Calendar, (calendar) => calendar.members, { onDelete: 'CASCADE' })
  calendar: Calendar;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: CalendarMemberRole, default: CalendarMemberRole.MEMBER })
  role: CalendarMemberRole;

  @CreateDateColumn()
  createdAt: Date;
}
