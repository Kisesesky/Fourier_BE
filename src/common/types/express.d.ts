import { ProjectMember } from '@/modules/projects/entities/project-member.entity';

declare global {
  namespace Express {
    interface Request {
      projectMember?: ProjectMember;
    }
  }
}