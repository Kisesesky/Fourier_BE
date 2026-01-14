// src/modules/chat/entities/dm-read.entity.ts
import { Entity, ManyToOne, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DmRoom } from './dm-room.entity';

@Entity()
@Unique(['user', 'room'])
export class DmRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => DmRoom, { onDelete: 'CASCADE' })
  room: DmRoom;

  @Column({ type: 'timestamptz' })
  lastReadAt: Date;
}