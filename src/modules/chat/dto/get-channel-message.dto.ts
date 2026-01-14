// src/modules/chat/dto/get-channel-messages.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class GetChannelMessagesDto {
  @ApiProperty()
  @IsUUID()
  channelId: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'cursor (createdAt ISO)' })
  @IsOptional()
  cursor?: string;
}