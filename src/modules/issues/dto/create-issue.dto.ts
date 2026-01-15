// src/modules/issue/dto/create-issue.dto.ts
import { IsUUID, IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus } from '../constants/issue-status.enum';

export class CreateIssueDto {
  @ApiProperty({ example: '로그인 버그 수정' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ enum: IssueStatus, example: IssueStatus.PLANNED })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ example: '2025-01-10' })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsNumber()
  progress?: number;

  @ApiPropertyOptional({ example: 'parent-issue-uuid', description: '상위 이슈 ID (서브태스크인 경우)' })
  @IsOptional()
  @IsUUID()
  parentId?: string; // 상위 업무가 있다면
}