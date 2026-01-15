// src/modules/issue/dto/add-subtask.dto.ts
import { IsUUID, IsString, IsOptional } from 'class-validator';

export class AddSubtaskDto {
  @IsUUID()
  parentId: string; // 상위 업무 ID

  @IsString()
  title: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string; // 담당자 선택 가능

  @IsOptional()
  startAt?: Date;

  @IsOptional()
  dueAt?: Date;
}