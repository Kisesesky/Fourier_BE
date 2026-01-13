// src/modules/docs/dto/update-cursor.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber } from 'class-validator';

export class UpdateCursorDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  documentId: string;

  @ApiProperty({ example: 12 })
  @IsNumber()
  position: number;
}