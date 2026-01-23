// src/modules/team/dto/team-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IconType } from 'src/common/constants/icon-type';
import { Team } from '../entities/team.entity';

export class TeamResponseDto {
  @ApiProperty({ example: 'team-uuid' })
  id: string;

  @ApiProperty({ example: 'Frontend Team' })
  name: string;

  @ApiProperty({ enum: IconType })
  iconType: IconType;

  @ApiProperty({ example: 'https://example.com/icon.png', nullable: true })
  iconValue?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  constructor(team: Team) {
    this.id = team.id;
    this.name = team.name;
    this.iconType = team.iconType;
    this.iconValue = team.iconValue;
    this.createdAt = team.createdAt;
  }
}
