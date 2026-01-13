// src/modules/team/dto/create-team.dto.ts
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { IconType } from "src/common/constants/icon-type";
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Team', description: '팀 이름' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ enum: IconType, example: IconType.EMOJI, required: false })
  @IsOptional()
  @IsEnum(IconType)
  iconType?: IconType;

  @ApiProperty({ example: '🔥', description: '아이콘 값 (이모지 or 아이콘 코드)', required: false })
  @IsOptional()
  @IsString()
  iconValue?: string;
}