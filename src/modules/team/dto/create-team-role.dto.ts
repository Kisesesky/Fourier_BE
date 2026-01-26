import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, MaxLength, ArrayMaxSize, ArrayUnique } from 'class-validator';

export class CreateTeamRoleDto {
  @ApiProperty({ example: 'Custom Editor' })
  @IsString()
  @MaxLength(40)
  name: string;

  @ApiProperty({ example: 'Manage projects and invite members', required: false })
  @IsString()
  @MaxLength(120)
  description?: string;

  @ApiProperty({ example: ['TEAM_INVITE_MEMBER', 'PROJECT_CREATE'] })
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsString({ each: true })
  permissions: string[];
}
