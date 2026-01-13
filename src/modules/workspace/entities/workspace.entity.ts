// src/modules/workspace/entities/workspace.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, ManyToOne } from 'typeorm';
import { Team } from '../../team/entities/team.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity()
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  createdBy: User;

  @OneToMany(() => Team, (team) => team.workspace)
  teams: Team[];

  @CreateDateColumn()
  createdAt: Date;
}