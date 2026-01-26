import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TeamRole } from '../constants/team-role.enum';

export class UpdateTeamMemberRoleDto {
  @ApiProperty({ enum: TeamRole, example: TeamRole.MEMBER })
  @IsEnum(TeamRole)
  role: TeamRole;
}
