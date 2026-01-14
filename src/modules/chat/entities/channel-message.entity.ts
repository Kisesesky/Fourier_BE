// src/modules/chat/entities/channel-message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinTable, ManyToMany, OneToMany, OneToOne } from 'typeorm';
import { Channel } from './channel.entity';
import { User } from '../../users/entities/user.entity';
import { MessageType } from '../constants/message-type.enum';
import { MessageFile } from './message-file.entity';
import { MessageReaction } from './message-reaction.entity';
import { LinkPreview } from './link-preview.entity';

@Entity()
export class ChannelMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Channel, (channel) => channel.messages, { onDelete: 'CASCADE' })
  channel: Channel;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'text', nullable: true })
  preview?: string;

  @OneToMany(() => MessageFile, (messagefile) => messagefile.channelMessage)
  files: MessageFile[];

  @Column({ type: 'timestamp', nullable: true })
  editedAt?: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => ChannelMessage, (message) => message.replies, { nullable: true, onDelete: 'CASCADE' })
  parentMessage?: ChannelMessage;

  @OneToMany(() => ChannelMessage, (message) => message.parentMessage)
  replies: ChannelMessage[];

  @Column({ default: 0 })
  replyCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastReplyAt?: Date;

  @OneToMany(() => MessageReaction, (reaction) => reaction.channelMessage)
  reactions: MessageReaction[];

  @ManyToOne(() => ChannelMessage, { nullable: true, onDelete: 'SET NULL' })
  replyTo?: ChannelMessage;

  @OneToOne(() => LinkPreview, (preview) => preview.channelMessage, { cascade: true, nullable: true })
  linkPreview?: LinkPreview;

  @CreateDateColumn()
  createdAt: Date;
}