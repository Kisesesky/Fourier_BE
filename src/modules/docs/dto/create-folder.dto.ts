// src/modules/docs/dto/create-folder.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ example: '기획', description: '폴더 이름' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'uuid', description: '부모 폴더 ID' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}