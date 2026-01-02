// src/modules/users/entities/user.entity.ts
import { Column, Entity } from "typeorm";
// Entity
import { BaseEntity } from "src/common/entities/base.entity"
// Types
import { RegisterStatus } from "src/common/constants/register-status";

@Entity()
export class User extends BaseEntity {
    @Column({ unique: true, nullable: true })
    email: string | null;

    @Column()
    name: string;

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
}
