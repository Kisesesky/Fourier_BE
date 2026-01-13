// src/modules/docs/dto/edit-document.dto.ts
import { IsString, IsArray, IsUUID, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EditOptionDto {
  @ApiProperty({ enum: ['insert', 'delete'], example: 'insert' })
  @IsString()
  type: 'insert' | 'delete';

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsString()
  @IsOptional()
  text?: string;

  @IsOptional()
  @IsNumber()
  length?: number;
}

export class EditDocumentDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  documentId: string;

  @ApiProperty({ type: [EditOptionDto], description: '편집 연산 목록 (CRDT)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditOptionDto)
  ops: EditOptionDto[];
}