import { BaseEntity } from "src/common/entities/base.entity";
import { User } from "src/modules/users/entities/user.entity";
import { Column, Entity, ManyToOne } from "typeorm";

export type MemberStatus = 'pending' | 'accepted' | 'blocked';

@Entity('members')
export class Member extends BaseEntity {
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  requester: User;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  recipient: User;

  @Column({ type: 'varchar', default: 'pending'})
  status: MemberStatus;
}
