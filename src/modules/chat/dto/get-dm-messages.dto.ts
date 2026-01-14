// src/modules/chat/dto/get-dm-messages.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetDmMessagesDto {
  @IsString()
  roomId: string;

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