// src/modules/docs/entities/document.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Folder } from './folder.entity';
import { DocumentVersion } from './document-version.entity';
import { DocumentCursor } from './document-cursor.entity';
import { DocumentMember } from './document-member.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToOne(() => Folder, (folder) => folder.documents, { nullable: true, onDelete: 'CASCADE' })
  folder?: Folder;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  author?: User;

  @OneToMany(() => DocumentMember, (member) => member.document)
  members: DocumentMember[];

  @OneToMany(() => DocumentVersion, (version) => version.document)
  versions: DocumentVersion[];

  @OneToMany(() => DocumentCursor, (cursor) => cursor.document)
  cursors: DocumentCursor[];

  @Column({ type: 'tsvector', select: false })
  searchVector: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}