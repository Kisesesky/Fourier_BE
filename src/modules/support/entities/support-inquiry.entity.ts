import { BaseEntity } from 'src/common/entities/base.entity';
import { Project } from 'src/modules/projects/entities/project.entity';
import { Team } from 'src/modules/team/entities/team.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('support_inquiry')
export class SupportInquiry extends BaseEntity {
  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  team: Team;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  requester: User;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', default: 'OPEN' })
  status: string;

  @Column({ type: 'varchar', default: 'FLOATING_WIDGET' })
  source: string;
}
