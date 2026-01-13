// src/modules/docs/entities/folder-member.entity.ts
import { User } from "src/modules/users/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { DocPermission } from "../constants/doc-permission.enum";
import { Folder } from "./folder.entity";

@Entity()
@Unique(['folder', 'user'])
export class FolderMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Folder, folder => folder.members, { onDelete: 'CASCADE' })
  folder: Folder;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: DocPermission })
  permission: DocPermission;
}