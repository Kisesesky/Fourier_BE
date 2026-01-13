// src/modules/issue/dto/ws-update-progress.dto.ts
import { IsUUID, IsNumber, Min, Max } from 'class-validator';

export class WsUpdateProgressDto {
  @IsUUID()
  issueId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;
}