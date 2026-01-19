// src/modules/issues/dto/gantt-issue.dto.ts
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class GanttIssueDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  startAt: Date;

  endAt: Date;
  
  @IsNumber()
  progress: number;

  assignee?: {
    id: string;
    name: string;
  };

  @IsString()
  color: string; 

  @IsOptional()
  @IsUUID()
  parentId?: string;
}