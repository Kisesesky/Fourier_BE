// src/modules/activity-log/entities/activity-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Team } from '../../team/entities/team.entity';
import { ActivityTargetType } from '../constants/activity-target-type.enum';

@Entity()
@Index(['project', 'createdAt'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  actor?: User;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  team: Team;

  @Column({ type: 'enum', enum: ActivityTargetType })
  targetType: ActivityTargetType;
  
  @Column()
  targetId: string;

  @Column()
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: {
    before?: any;
    after?: any;
    meta?: any;
  };

  @CreateDateColumn()
  createdAt: Date;
}