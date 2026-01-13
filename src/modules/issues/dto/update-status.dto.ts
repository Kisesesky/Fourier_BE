// src/modules/issue/dto/update-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { IssueStatus } from '../constants/issue-status.enum';

export class UpdateStatusDto {
  @ApiProperty({ enum: IssueStatus, example: IssueStatus.IN_PROGRESS })
  @IsEnum(IssueStatus)
  status: IssueStatus;
}