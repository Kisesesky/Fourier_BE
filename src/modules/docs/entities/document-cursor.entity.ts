// src/modules/docs/entities/document-cursor.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Document } from './document.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class DocumentCursor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, (doc) => doc.cursors, { onDelete: 'CASCADE' })
  document: Document;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'int', default: 0 })
  position: number; // 텍스트 내 커서 위치

  @CreateDateColumn()
  updatedAt: Date;
}