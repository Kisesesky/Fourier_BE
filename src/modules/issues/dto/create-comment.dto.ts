// src/modules/issue/dto/create-comment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: '이 부분은 이렇게 수정하는 게 좋겠습니다.' })
  @IsString()
  content: string;
}