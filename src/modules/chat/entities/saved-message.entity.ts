// src/modules/chat/entities/saved-message.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChannelMessage } from './channel-message.entity';
import { DmMessage } from './dm-message.entity';

@Entity()
@Unique(['user', 'channelMessage'])
@Unique(['user', 'dmMessage'])
export class SavedMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => ChannelMessage, { nullable: true, onDelete: 'SET NULL' })
  channelMessage?: ChannelMessage;

  @ManyToOne(() => DmMessage, { nullable: true, onDelete: 'SET NULL' })
  dmMessage?: DmMessage;

  @CreateDateColumn()
  savedAt: Date;
}