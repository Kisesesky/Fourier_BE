// src/modules/project/dto/update-project-member.dto.ts
import { IsEnum, IsUUID } from 'class-validator';
import { ProjectRole } from '../constants/project-role.enum';

export class UpdateProjectMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(ProjectRole)
  role: ProjectRole;
}