// src/modules/chat/entities/channel-read.entity.ts
import { Entity, ManyToOne, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Channel } from './channel.entity';

@Entity()
@Unique(['user', 'channel'])
export class ChannelRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  channel: Channel;

  @Column({ type: 'timestamptz' })
  lastReadAt: Date;
}