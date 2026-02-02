// src/modules/calendar/dto/update-calendar-event.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, IsDateString } from "class-validator";

export class UpdateCalendarEventDto {
  @ApiProperty({ example: '스프린트 회의' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: '회의' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'calendar-uuid', required: false })
  @IsOptional()
  @IsUUID()
  calendarId?: string;

  @ApiProperty({ example: '2025-01-10T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiProperty({ example: '2025-01-11T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiProperty({ example: '회의실 A', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: '안건 정리', required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}
