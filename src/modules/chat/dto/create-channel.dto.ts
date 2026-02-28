import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ChannelType } from '../constants/channel-type.enum';

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

  @ApiPropertyOptional({ enum: ChannelType, default: ChannelType.CHAT })
  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;
}
