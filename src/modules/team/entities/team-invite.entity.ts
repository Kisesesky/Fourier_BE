// src/modules/team/entities/team-invite.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Unique } from 'typeorm';
import { Team } from './team.entity';
import { User } from '../../users/entities/user.entity';
import { TeamInviteStatus } from '../constants/team-invite-status.enum';
import { TeamRole } from '../constants/team-role.enum';

@Entity()
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

  @Column({ type: 'enum', enum: TeamRole, default: TeamRole.MEMBER })
  role: TeamRole;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @CreateDateColumn()
  createdAt: Date;
}
