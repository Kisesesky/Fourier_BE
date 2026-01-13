// src/modules/project/guards/project-manage.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ProjectRole } from '../constants/project-role.enum';

@Injectable()
export class ProjectManageGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const projectMember = req.projectMember;

    if (!projectMember) {
      throw new ForbiddenException('프로젝트 멤버 정보 없음');
    }

    if (
      projectMember.role !== ProjectRole.OWNER &&
      projectMember.role !== ProjectRole.MAINTAINER
    ) {
      throw new ForbiddenException('프로젝트 관리 권한이 없습니다.');
    }

    return true;
  }
}