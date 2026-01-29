// src/modules/chat/entities/channel-preference.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('channel_preference')
@Unique(['project', 'user'])
export class ChannelPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  pinnedChannelIds: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  archivedChannelIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
