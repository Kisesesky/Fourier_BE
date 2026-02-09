// src/modules/docs/dto/create-document.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ example: 'project-uuid', description: '프로젝트 ID' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ example: '회의록', description: '문서 제목' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '오늘 회의에서는...', description: '문서 내용' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'uuid', description: '상위 폴더 ID' })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional({ example: false, description: '즐겨찾기 여부' })
  @IsBoolean()
  @IsOptional()
  starred?: boolean;
}
