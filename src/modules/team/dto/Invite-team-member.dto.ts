// src/modules/team/dto/invite-team-member.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class InviteTeamMemberDto {
  @ApiProperty({ description: '초대할 유저 ID', example: 'user-uuid' })
  @IsUUID()
  userId: string;
}