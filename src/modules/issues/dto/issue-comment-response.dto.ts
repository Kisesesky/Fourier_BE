// src/modules/issue/dto/issue-comment-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IssueUserDto } from './issue-user.dto';

export class IssueCommentResponseDto {
  @ApiProperty({ example: 'comment-uuid' })
  id: string;

  @ApiProperty({ example: '이 부분은 이렇게 고치는 게 좋겠습니다.' })
  content: string;

  @ApiProperty({ type: IssueUserDto })
  author: IssueUserDto;

  @ApiProperty({ example: '2025-01-01T12:00:00.000Z' })
  createdAt: Date;
}