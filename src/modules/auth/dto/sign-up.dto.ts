// src/auth/dto/sign-in.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString, IsStrongPassword, MinLength } from "class-validator";

export class SignUpDto {
  @ApiProperty({ example: 'test@test.com', description: '사용자 이메일'})
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'tester', description: '사용자 이름' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ example: 'Password123!', description: '비밀번호 (영문 대소문자, 숫자, 특수문자 포함 8자 이상)' })
  @IsOptional()
  @IsStrongPassword()
  password?: string; // users에서 해시 처리

  @ApiProperty({ example: true, description: '서비스 이용 약관 동의' })
  @IsBoolean()
  agreedTerms: boolean;

  @ApiProperty({ example: true, description: '개인정보 처리 방침 동의' })
  @IsBoolean()
  agreedPrivacy: boolean;
}
