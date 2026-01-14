// src/modules/chat/entities/message-file.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { File } from 'src/modules/files/entities/file.entity';
import { ChannelMessage } from './channel-message.entity';
import { DmMessage } from './dm-message.entity';

@Entity()
export class MessageFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => File, { eager: true, onDelete: 'CASCADE' })
  file: File;

  @ManyToOne(() => ChannelMessage, (message) => message.files, { nullable: true, onDelete: 'CASCADE' })
  channelMessage?: ChannelMessage;

  @ManyToOne(() => DmMessage, (message) => message.files, { nullable: true, onDelete: 'CASCADE' })
  dmMessage?: DmMessage;

  @CreateDateColumn()
  createdAt: Date;
}