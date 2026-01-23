// src/modules/project/dto/project-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IconType } from 'src/common/constants/icon-type';
import { Project } from '../entities/project.entity';
import { ProjectStatus } from '../constants/project-status.enum';

export class ProjectResponseDto {
  @ApiProperty({ example: 'project-uuid' })
  id: string;

  @ApiProperty({ example: 'New Project' })
  name: string;

  @ApiProperty({ example: '프로젝트 설명', nullable: true })
  description?: string;

  @ApiProperty({ enum: IconType })
  iconType: IconType;

  @ApiProperty({ example: 'https://example.com/icon.png', nullable: true })
  iconValue?: string;

  @ApiProperty({ enum: ProjectStatus })
  status: ProjectStatus;

  @ApiProperty({ example: false })
  isFavorite?: boolean;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  constructor(project: Project & { isFavorite?: boolean }) {
    this.id = project.id;
    this.name = project.name;
    this.description = project.description;
    this.iconType = project.iconType;
    this.iconValue = project.iconValue;
    this.status = project.status;
    this.isFavorite = project.isFavorite ?? false;
    this.createdAt = project.createdAt;
  }
}
