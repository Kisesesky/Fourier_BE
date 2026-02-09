// src/modules/files/entities/file.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { FileStatus } from '../constants/file-status.enum';
import { FileType } from '../constants/file-type.enum';
import { Project } from 'src/modules/projects/entities/project.entity';
import { FileFolder } from './file-folder.entity';

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column()
  fileName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'enum', enum: FileType })
  type: FileType;

  @Column({ type: 'enum', enum: FileStatus, default: FileStatus.PENDING })
  status: FileStatus;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  uploadedBy?: User;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  project?: Project | null;

  @ManyToOne(() => FileFolder, (folder) => folder.files, { onDelete: 'SET NULL', nullable: true })
  folder?: FileFolder | null;
}
