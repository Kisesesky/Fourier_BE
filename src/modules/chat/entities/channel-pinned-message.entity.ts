// src/modules/chat/entities/channel-pinned-message.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { Channel } from './channel.entity';
import { ChannelMessage } from './channel-message.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
@Unique(['channel', 'message'])
export class ChannelPinnedMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  channel: Channel;

  @ManyToOne(() => ChannelMessage, { onDelete: 'CASCADE' })
  message: ChannelMessage;

  @ManyToOne(() => User)
  pinnedBy: User;

  @CreateDateColumn()
  pinnedAt: Date;
}