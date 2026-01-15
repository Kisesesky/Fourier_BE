// src/modules/chat/entities/thread-read.entity.ts
import { User } from "src/modules/users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, UpdateDateColumn, Column } from "typeorm";
import { ChannelMessage } from "./channel-message.entity";

@Entity()
export class ThreadRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => ChannelMessage, { onDelete: 'CASCADE' })
  threadParent: ChannelMessage;

  @Column({ type: 'timestamp' })
  lastReadAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}