import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { ChannelMessage } from "./channel-message.entity";
import { DmMessage } from "./dm-message.entity";

// src/modules/chat/entities/link-preview.entity.ts
@Entity()
export class LinkPreview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  url: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true })
  siteName?: string;

  @OneToOne(() => ChannelMessage, (message) => message.linkPreview, { onDelete: 'CASCADE' })
  @JoinColumn()
  channelMessage?: ChannelMessage;

  @OneToOne(() => DmMessage, (message) => message.linkPreview, { onDelete: 'CASCADE' })
  @JoinColumn()
  dmMessage?: DmMessage;

  @CreateDateColumn()
  createdAt: Date;
}