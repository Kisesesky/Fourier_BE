import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTeamMemberNicknameDto {
  @ApiPropertyOptional({ example: '팀 닉네임', maxLength: 32, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  nickname?: string;
}
