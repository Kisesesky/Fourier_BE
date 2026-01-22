// src/modules/issue/dto/issue-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IssueUserDto } from './issue-user.dto';
import { IssueCommentResponseDto } from './issue-comment-response.dto';
import { IssueStatus } from '../constants/issue-status.enum';

export class IssueResponseDto {
  @ApiProperty({ example: 'issue-uuid' })
  id: string;

  @ApiProperty({ example: '로그인 버그 수정' })
  title: string;

  @ApiProperty({ enum: IssueStatus })
  status: IssueStatus;

  @ApiProperty({ example: 40 })
  progress: number;

  @ApiProperty({ example: '2025-01-01', nullable: true })
  startAt?: Date;

  @ApiProperty({ example: '2025-01-10', nullable: true })
  endAt?: Date;

  @ApiProperty({ type: IssueUserDto, nullable: true })
  assignee?: IssueUserDto;

  @ApiProperty({ type: IssueUserDto })
  creator: IssueUserDto;  

  @ApiProperty({ type: () => [IssueResponseDto] })
  subtasks: IssueResponseDto[];

  @ApiProperty({ type: () => [IssueCommentResponseDto] })
  comments: IssueCommentResponseDto[];

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;
}