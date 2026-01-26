// src/modules/team/dto/invite-team-member.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { TeamRole } from '../constants/team-role.enum';

export class InviteTeamMemberDto {
  @ApiProperty({ description: '초대할 유저 이메일', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: TeamRole, example: TeamRole.MEMBER })
  @IsEnum(TeamRole)
  role: TeamRole;

  @ApiProperty({ description: '초대 메시지', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
