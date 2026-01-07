// src/modules/channel/entities/channel-member.entity.ts
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Channel } from "./channel.entity";
import { User } from "src/modules/users/entities/user.entity";

export enum ChannelMemberRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

@Entity()
@Unique(['channel', 'user'])
export class ChannelMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  channel: Channel;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: ChannelMemberRole,
    default: ChannelMemberRole.MEMBER,
  })
  role: ChannelMemberRole;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastReadAt: Date | null;

  @Column({ default: false })
  isMuted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  mutedUntil: Date | null;
}