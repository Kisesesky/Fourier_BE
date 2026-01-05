// src/modules/verification/dto/verify-emil-code.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { SendEmailCodeDto } from './send-email-code.dto';

export class VerifyEmailCodeDto extends SendEmailCodeDto {
  @ApiProperty({ example: '123456', description: '인증 코드' })
  @IsString()
  code: string;
}