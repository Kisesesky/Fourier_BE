// src/modules/notification/dto/mark-read.dto.ts
import { IsUUID } from 'class-validator';

export class MarkReadDto {
  @IsUUID()
  id: string;
}