// src/modules/issue/dto/ws-remove-subtask.dto.ts
import { IsUUID } from 'class-validator';

export class WsRemoveSubtaskDto {
  @IsUUID()
  subtaskId: string;
}