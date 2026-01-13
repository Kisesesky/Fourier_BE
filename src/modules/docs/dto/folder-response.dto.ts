// src/modules/docs/dto/folder-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class FolderResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: '기획' })
  name: string;

  @ApiProperty({ example: 'uuid', nullable: true })
  parentId?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;
}