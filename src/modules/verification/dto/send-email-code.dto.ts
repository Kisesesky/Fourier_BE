// src/modules/verification/dto/send-emil-code.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SendEmailCodeDto {
  @ApiProperty({ example: 'test@test.com', description: '이메일 주소' })
  @IsEmail()
  email: string;
}