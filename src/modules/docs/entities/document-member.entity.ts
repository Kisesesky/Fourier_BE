// src/modules/docs/entities/document-member.entity.ts
import { User } from "src/modules/users/entities/user.entity";
import { Entity, Unique, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { DocPermission } from "../constants/doc-permission.enum";
import { Document } from './document.entity';

@Entity()
@Unique(['document', 'user'])
export class DocumentMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, doc => doc.members, { onDelete: 'CASCADE' })
  document: Document;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: DocPermission })
  permission: DocPermission;
}