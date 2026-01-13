// src/modules/docs/dto/create-document.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateDocumentDto {
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
}