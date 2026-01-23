// src/modules/team/dto/create-team.dto.ts
import { IsEnum, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { IconType } from "src/common/constants/icon-type";
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Team', description: '팀 이름' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ enum: IconType, example: IconType.IMAGE, required: false })
  @IsOptional()
  @IsEnum(IconType)
  @IsIn([IconType.IMAGE])
  iconType?: IconType;

  @ApiProperty({ example: 'https://example.com/icon.png', description: '아이콘 이미지 URL', required: false })
  @IsOptional()
  @IsString()
  iconValue?: string;
}
