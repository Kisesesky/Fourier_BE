import { BaseEntity } from "src/common/entities/base.entity";
import { User } from "src/modules/users/entities/user.entity";
import { Column, Entity, ManyToMany, ManyToOne } from "typeorm";

export type MemberStatus = 'pending' | 'accepted' | 'blocked';

@Entity()
export class Member extends BaseEntity {
  @ManyToMany(() => User, { eager: true })
  requester: User;

  @ManyToOne(() => User, { eager: true })
  recipient: User;

  @Column({ type: 'varchar', default: 'pending'})
  status: MemberStatus;
}
