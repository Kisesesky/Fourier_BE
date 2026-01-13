// src/modules/users/dto/update-user.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
  @ApiProperty({ example: '김철수', description: '사용자 이름', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;
}