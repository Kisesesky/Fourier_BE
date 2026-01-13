// src/modules/chat/dto/get-messages.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber } from 'class-validator';

export class GetMessagesDto {
  @ApiProperty({ description: '채널 ID 또는 DM 룸 ID', example: 'room-or-channel-uuid' })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({ description: '가져올 메시지 수', example: 50 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: '커서 (createdAt 기준)', example: '2025-01-01T12:00:00.000Z' })
  @IsOptional()
  cursor?: string;
}