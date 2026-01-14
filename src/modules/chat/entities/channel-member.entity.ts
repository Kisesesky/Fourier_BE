// src/modules/chat/entities/channel-member.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Channel } from './channel.entity';

@Entity()
export class ChannelMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Channel, channel => channel.id)
  @JoinColumn({ name: 'channelId' })
  channel: Channel;
}