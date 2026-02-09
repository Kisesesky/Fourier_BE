// src/modules/users/dto/update-user.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
  @ApiProperty({ example: '김철수', description: '사용자 이름', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;

  @ApiProperty({ example: 'https://example.com/bg.png', description: '프로필 배경 이미지 URL', required: false })
  @IsOptional()
  @IsString()
  backgroundImageUrl?: string;

  @ApiProperty({ example: '커피 한잔 하실래요?', description: '소개', required: false })
  @IsOptional()
  @IsString()
  bio?: string;
}
