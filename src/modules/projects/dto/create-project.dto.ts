// src/modules/project/dto/create-project.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength, IsUUID } from 'class-validator';
import { IconType } from 'src/common/constants/icon-type';

export class CreateProjectDto {
  @ApiProperty({ example: 'New Project' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '프로젝트 설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: IconType, example: IconType.EMOJI })
  @IsOptional()
  @IsEnum(IconType)
  iconType?: IconType;

  @ApiProperty({ example: '🚀', required: false })
  @IsOptional()
  @IsString()
  iconValue?: string;

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