// src/modules/chat/dto/channel-preferences.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class GetChannelPreferencesDto {
  @ApiProperty({ example: 'project-uuid' })
  @IsUUID()
  projectId: string;
}

export class SaveChannelPreferencesDto {
  @ApiProperty({ example: 'project-uuid' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ example: ['channel-uuid-1', 'channel-uuid-2'] })
  @IsArray()
  @IsUUID('all', { each: true })
  pinnedChannelIds: string[];

  @ApiPropertyOptional({ example: ['channel-uuid-3'] })
  @IsArray()
  @IsUUID('all', { each: true })
  archivedChannelIds: string[];
}
