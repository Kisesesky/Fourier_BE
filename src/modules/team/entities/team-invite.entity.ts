// src/modules/team/entities/team-invite.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Unique } from 'typeorm';
import { Team } from './team.entity';
import { User } from '../../users/entities/user.entity';
import { TeamInviteStatus } from '../constants/team-invite-status.enum';

@Entity()
@Unique(['team', 'invitee'])
export class TeamInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  team: Team;

  /** 초대한 사람 */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  inviter: User;

  /** 초대받은 사람 */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  invitee: User;

  @Column({ type: 'enum', enum: TeamInviteStatus, default: TeamInviteStatus.PENDING })
  status: TeamInviteStatus;

  @CreateDateColumn()
  createdAt: Date;
}