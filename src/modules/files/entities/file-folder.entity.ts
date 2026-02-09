import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Project } from 'src/modules/projects/entities/project.entity';
import { File } from './file.entity';

@Entity('file_folder')
export class FileFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @OneToMany(() => File, (file) => file.folder)
  files: File[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

