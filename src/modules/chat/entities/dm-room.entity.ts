// src/modules/chat/entities/dm-room.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DmMessage } from './dm-message.entity';

@Entity()
export class DmRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @OneToMany(() => DmMessage, (msg) => msg.room)
  messages: DmMessage[];

  @CreateDateColumn()
  createdAt: Date;
}