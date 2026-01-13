// src/modules/project/dto/add-project-member.dto.ts
import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '../constants/project-role.enum';

export class AddProjectMemberDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: ProjectRole, example: ProjectRole.MEMBER })
  @IsEnum(ProjectRole)
  role: ProjectRole;
}