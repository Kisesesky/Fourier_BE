import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTeamMemberAvatarDto {
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png', maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
