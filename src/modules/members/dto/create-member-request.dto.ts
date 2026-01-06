// src/modules/member/dto/create-member-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateMemberRequestDto {
  @ApiProperty({ example: 'test1@test.com', description: '친구 요청 받을 이메일' })
  @IsEmail()
  recipientEmail: string;
}