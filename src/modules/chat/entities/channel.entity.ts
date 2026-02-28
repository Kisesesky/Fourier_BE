// src/modules/chat/entities/channel.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { ChannelMessage } from './channel-message.entity';
import { ChannelMember } from './channel-member.entity';
import { ChannelType } from '../constants/channel-type.enum';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Project, (project) => project.channels, { onDelete: 'CASCADE' })
  project: Project;

  @Column({ default: false })
  isDefault: boolean

  @Column({ type: 'enum', enum: ChannelType, default: ChannelType.CHAT })
  type: ChannelType;

  @OneToMany(() => ChannelMessage, (message) => message.channel)
  messages: ChannelMessage[];

  @OneToMany(() => ChannelMember, member => member.channel)
  members: ChannelMember[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
