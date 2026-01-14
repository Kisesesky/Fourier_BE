import { User } from "src/modules/users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index, In } from "typeorm";

@Entity()
@Index(['scope', 'scopeId'])
@Index(['content'], { fulltext: true })
@Index(['sender'])
export class MessageSearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @Column({ type: 'enum', enum: ['CHANNEL', 'DM'] })
  scope: 'CHANNEL' | 'DM';

  @Column()
  scopeId: string;

  @Column('text')
  content: string;

  @ManyToOne(() => User)
  sender: User;

  @CreateDateColumn()
  createdAt: Date;
}