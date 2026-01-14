// src/modules/chat/entities/channel.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { ChannelMessage } from './channel-message.entity';
import { ChannelMember } from './channel-member.entity';

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

  @OneToMany(() => ChannelMessage, (message) => message.channel)
  messages: ChannelMessage[];

  @OneToMany(() => ChannelMember, member => member.channel)
  members: ChannelMember[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}