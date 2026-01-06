// src/modules/chat/dto/send-message.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: '안녕하세요!', description: '전송할 메시지 내용' })
  @IsString()
  @MinLength(1)
  content: string;
}