// src/modules/chat/entities/channel.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { ChannelMessage } from './channel-message.entity';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Project, (project) => project.channels, { onDelete: 'CASCADE' })
  project: Project;

  @OneToMany(() => ChannelMessage, (msg) => msg.channel)
  messages: ChannelMessage[];

  @CreateDateColumn()
  createdAt: Date;
}