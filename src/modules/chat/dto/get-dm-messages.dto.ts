// src/modules/chat/dto/get-dm-messages.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetDmMessagesDto {
  @ApiProperty({ example: 'dm-room-uuid' })
  @IsString()
  roomId: string;

  @ApiPropertyOptional({ default: 50, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({ example: '2026-01-01T12:00:00.000Z', required: false })
  @IsOptional()
  cursor?: string;
}