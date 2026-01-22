// src/modules/mention/entities/mention.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { MentionTargetType } from '../constants/mention-target-type.enum';

@Entity()
@Index(['mentionedUserId', 'createdAt'])
@Index(['mentionedUserId', 'targetId'], { unique: true })
export class Mention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mentionedUserId: string; // 알림 대상

  @Column({ nullable: true })
  actorId?: string; // 멘션한 사람

  @Column({ type: 'enum', enum: MentionTargetType })
  type: MentionTargetType;

  @Column()
  targetId: string; // issueId, commentId 등

  @Column()
  teamId: string;

  @Column({ nullable: true })
  projectId?: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}