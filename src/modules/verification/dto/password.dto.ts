// src/modules/verificaiton/dto/password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword, Validate } from 'class-validator';
import { SendEmailCodeDto } from './send-email-code.dto';
import { MatchPasswordConstraint } from 'src/common/validators/match-password.constraint';

export class PasswordDto extends SendEmailCodeDto {

  @ApiProperty({ example: 'Password123!', description: '비밀번호 (영문 대소문자, 숫자, 특수문자 포함 8자 이상)' })
  @IsStrongPassword()
  newPassword: string;

  @ApiProperty({ example: 'Password123!', description: '비밀번호 (영문 대소문자, 숫자, 특수문자 포함 8자 이상)' })
  @Validate(MatchPasswordConstraint)
  confirmPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Password124!', description: '비밀번호 (영문 대소문자, 숫자, 특수문자 포함 8자 이상)' })
  @IsStrongPassword()
  currentPassword: string;

  @ApiProperty({ example: 'Password123!', description: '비밀번호 (영문 대소문자, 숫자, 특수문자 포함 8자 이상)' })
  @IsStrongPassword()
  newPassword: string;

  @ApiProperty({ example: 'Password123!', description: '비밀번호 (영문 대소문자, 숫자, 특수문자 포함 8자 이상)' })
  @Validate(MatchPasswordConstraint)
  confirmPassword: string;
}