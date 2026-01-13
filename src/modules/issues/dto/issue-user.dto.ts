// src/modules/issue/dto/issue-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class IssueUserDto {
  @ApiProperty({ example: 'user-uuid' })
  id: string;

  @ApiProperty({ example: '홍길동' })
  name: string;
}