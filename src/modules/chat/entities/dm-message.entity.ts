// src/modules/chat/entities/dm-message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
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

  @Column()
  senderId: string;

  @Column()
  senderName: string;

  @Column({ nullable: true })
  senderAvatar?: string;

  @Column({ type: 'timestamp', nullable: true })
  editedAt?: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => DmMessage, (message) => message.threadMessages, { nullable: true, onDelete: 'CASCADE' })
  threadParent?: DmMessage;

  @OneToMany(() => DmMessage, (message) => message.threadParent)
  threadMessages: DmMessage[];

  @Column({ default: 0 })
  threadCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastThreadAt?: Date;

  @OneToMany(() => MessageReaction, (reaction) => reaction.dmMessage)
  reactions: MessageReaction[];

  @ManyToOne(() => DmMessage, { nullable: true,  onDelete: 'SET NULL' })
  replyTo?: DmMessage;

  @OneToOne(() => LinkPreview, (preview) => preview.dmMessage, { cascade: true, nullable: true })
  linkPreview?: LinkPreview;

  @CreateDateColumn()
  createdAt: Date;
}