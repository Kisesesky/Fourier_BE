// src/modules/chat/entities/channel-message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Channel } from '../../channel/entities/channel.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class ChannelMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  channel: Channel;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @Column()
  content: string;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}