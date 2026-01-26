// src/modules/team/entities/team-member.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Unique } from 'typeorm';
import { Team } from './team.entity';
import { User } from '../../users/entities/user.entity';
import { TeamRole } from '../constants/team-role.enum';
import { TeamRolePolicy } from './team-role-policy.entity';

@Entity()
@Unique(['team', 'user'])
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Team, (team) => team.members, { onDelete: 'CASCADE' })
  team: Team;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: TeamRole, default: TeamRole.MEMBER })
  role: TeamRole;

  @ManyToOne(() => TeamRolePolicy, { nullable: true, onDelete: 'SET NULL' })
  customRole?: TeamRolePolicy | null;

  @CreateDateColumn()
  joinedAt: Date;
}
