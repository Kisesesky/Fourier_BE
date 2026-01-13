// src/modules/chat/entities/message-reaction.entity.ts
import { User } from "src/modules/users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from "typeorm";
import { ChannelMessage } from "./channel-message.entity";
import { DmMessage } from "./dm-message.entity";

@Index(['emoji', 'user', 'channelMessage'], { unique: true })
@Index(['emoji', 'user', 'dmMessage'], { unique: true })
@Entity()
export class MessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 32 })
  emoji: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => ChannelMessage, (message) => message.reactions, { nullable: true, onDelete: 'CASCADE' })
  channelMessage?: ChannelMessage;

  @ManyToOne(() => DmMessage, (message) => message.reactions, { nullable: true, onDelete: 'CASCADE' })
  dmMessage?: DmMessage;

  @CreateDateColumn()
  createdAt: Date;
}