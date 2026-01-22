// src/modules/activity-log/entities/activity-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ActivityTargetType } from '../constants/activity-target-type.enum';

@Entity()
@Index(['teamId', 'createdAt'])
@Index(['projectId', 'createdAt'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  actorId?: string;

  @Column()
  teamId: string;

  @Column({ nullable: true })
  projectId?: string;

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