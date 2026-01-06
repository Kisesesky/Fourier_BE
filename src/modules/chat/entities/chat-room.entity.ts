import { BaseEntity } from "src/common/entities/base.entity";
import { User } from "src/modules/users/entities/user.entity";
import { Column, Entity, ManyToOne, Unique } from "typeorm";

@Entity('chat_room')
@Unique(['userA', 'userB'])
export class ChatRoom extends BaseEntity {
  @ManyToOne(() => User)
  userA: User;

  @ManyToOne(() => User)
  userB: User;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date;
}
