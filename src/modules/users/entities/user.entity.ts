// src/modules/users/entities/user.entity.ts
import { Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from "src/common/entities/base.entity"
import { RegisterStatus } from "src/common/constants/register-status";
import { Workspace } from "src/modules/workspace/entities/workspace.entity";

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column()
  name: string;

  @Column({ nullable: true })
  displayName: string | null;

  @Column({ nullable: true })
  avatarUrl: string | null;

  @Column({ nullable: true })
  password: string | null;

  @Column({ type: 'varchar', })
  provider?: RegisterStatus;

  @Column({ nullable: true })
  providerId?: string | null;

  @Column({ default: false })
  agreedTerms: boolean;

  @Column({ default: false })
  agreedPrivacy: boolean;

  @OneToMany(() => Workspace, (workspace) => workspace.createdBy)
  workspaces: Workspace[];
}
