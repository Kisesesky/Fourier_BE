// src/modules/projects/entities/project-member.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Unique, ManyToOne, CreateDateColumn } from 'typeorm';
import { Project } from './project.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { ProjectRole } from '../constants/project-role.enum';

@Entity()
@Unique(['project', 'user'])
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: ProjectRole, default: ProjectRole.MEMBER })
  role: ProjectRole;

  @CreateDateColumn()
  joinedAt: Date;
}