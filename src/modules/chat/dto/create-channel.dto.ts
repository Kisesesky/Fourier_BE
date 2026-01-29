import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({ example: 'project-uuid' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ example: 'design' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: ['user-uuid-1', 'user-uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  memberIds?: string[];
}
