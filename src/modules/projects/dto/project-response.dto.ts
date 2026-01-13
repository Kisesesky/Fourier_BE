// src/modules/project/dto/project-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IconType } from 'src/common/constants/icon-type';
import { Project } from '../entities/project.entity';

export class ProjectResponseDto {
  @ApiProperty({ example: 'project-uuid' })
  id: string;

  @ApiProperty({ example: 'New Project' })
  name: string;

  @ApiProperty({ example: '프로젝트 설명', nullable: true })
  description?: string;

  @ApiProperty({ enum: IconType })
  iconType: IconType;

  @ApiProperty({ example: '🚀', nullable: true })
  iconValue?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  constructor(project: Project) {
    this.id = project.id;
    this.name = project.name;
    this.description = project.description;
    this.iconType = project.iconType;
    this.iconValue = project.iconValue;
    this.createdAt = project.createdAt;
  }
}