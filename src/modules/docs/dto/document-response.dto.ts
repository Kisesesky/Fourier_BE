// src/modules/docs/dto/document-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class DocumentResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: '회의록' })
  title: string;

  @ApiProperty({ example: '회의 내용...' })
  content: string;

  @ApiProperty({ example: 'uuid', nullable: true })
  folderId?: string;

  @ApiProperty({ example: 'uuid', nullable: true })
  authorId?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-02T00:00:00.000Z' })
  updatedAt: Date;
}