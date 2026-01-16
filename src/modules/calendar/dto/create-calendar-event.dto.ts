// src/modules/calendar/dto/create-calendar-event.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateCalendarEventDto {
  @ApiProperty({ example: '스프린트 회의' })
  @IsString()
  title: string;

  @ApiProperty({ example: '회의' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: '2025-01-10T10:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2025-01-10T11:00:00.000Z' })
  @IsDateString()
  endAt: string;

  @ApiProperty({ example: '회의실 A', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: '안건 정리', required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}