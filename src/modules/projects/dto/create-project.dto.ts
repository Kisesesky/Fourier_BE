// src/modules/project/dto/create-project.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsOptional, IsEnum, MinLength, IsUUID } from 'class-validator';
import { IconType } from 'src/common/constants/icon-type';
import { ProjectStatus } from '../constants/project-status.enum';

export class CreateProjectDto {
  @ApiProperty({ example: 'New Project' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: '프로젝트 설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: IconType, example: IconType.IMAGE })
  @IsOptional()
  @IsEnum(IconType)
  @IsIn([IconType.IMAGE])
  iconType?: IconType;

  @ApiProperty({ example: 'https://example.com/icon.png', required: false })
  @IsOptional()
  @IsString()
  iconValue?: string;

  @ApiProperty({ enum: ProjectStatus, required: false })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({
    type: [String],
    required: false,
    description: '프로젝트 생성 시 함께 추가할 팀 멤버 ID 목록',
    example: ['user-uuid-1', 'user-uuid-2'],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  selectedUserIds?: string[];
}
