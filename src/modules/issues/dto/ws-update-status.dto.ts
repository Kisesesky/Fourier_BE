// src/modules/issue/dto/ws-update-status.dto.ts
import { IsUUID, IsEnum } from 'class-validator';
import { IssueStatus } from '../constants/issue-status.enum';

export class WsUpdateStatusDto {
  @IsUUID()
  issueId: string;

  @IsEnum(IssueStatus)
  status: IssueStatus;
}