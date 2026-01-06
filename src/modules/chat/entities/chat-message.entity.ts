import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { User } from "src/modules/users/entities/user.entity";
import { ChatRoom } from "./chat-room.entity";

@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
  room: ChatRoom;

  @ManyToOne(() => User, { eager: true })
  sender: User;

  @Column('text')
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}