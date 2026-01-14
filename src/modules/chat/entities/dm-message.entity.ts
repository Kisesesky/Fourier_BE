// src/modules/chat/entities/dm-message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinTable, ManyToMany, OneToMany, OneToOne } from 'typeorm';
import { DmRoom } from './dm-room.entity';
import { User } from '../../users/entities/user.entity';
import { MessageType } from '../constants/message-type.enum';
import { MessageFile } from './message-file.entity';
import { MessageReaction } from './message-reaction.entity';
import { LinkPreview } from './link-preview.entity';

@Entity()
export class DmMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'text', nullable: true })
  preview?: string;

  @OneToMany(() => MessageFile, (messagefile) => messagefile.dmMessage)
  files: MessageFile[];
  
  @ManyToOne(() => DmRoom, (room) => room.messages, { onDelete: 'CASCADE' })
  room: DmRoom;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @Column({ type: 'timestamp', nullable: true })
  editedAt?: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => DmMessage, (message) => message.replies, { nullable: true, onDelete: 'CASCADE' })
  parentMessage?: DmMessage;

  @OneToMany(() => DmMessage, (message) => message.parentMessage)
  replies: DmMessage[];

  @Column({ default: 0 })
  replyCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastReplyAt?: Date;

  @OneToMany(() => MessageReaction, (reaction) => reaction.dmMessage)
  reactions: MessageReaction[];

  @ManyToOne(() => DmMessage, { nullable: true,  onDelete: 'SET NULL' })
  replyTo?: DmMessage;

  @OneToOne(() => LinkPreview, (preview) => preview.dmMessage, { cascade: true, nullable: true })
  linkPreview?: LinkPreview;

  @CreateDateColumn()
  createdAt: Date;
}