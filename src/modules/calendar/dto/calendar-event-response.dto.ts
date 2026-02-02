// src/modules/calendar/dto/calendar-event-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { CalendarCategoryResponseDto } from './calendar-category-response.dto';

export class CalendarEventResponseDto {
  @ApiProperty({ example: 'event-uuid' })
  id: string;

  @ApiProperty({ example: '스프린트 회의' })
  title: string;

  @ApiProperty({ example: '회의' })
  category: CalendarCategoryResponseDto;

  @ApiProperty({ example: 'calendar-uuid', required: false })
  calendarId?: string;

  @ApiProperty({ example: '2025-01-10T10:00:00.000Z' })
  startAt: Date;

  @ApiProperty({ example: '2025-01-10T11:00:00.000Z' })
  endAt: Date;

  @ApiProperty({ example: '회의실 A', required: false })
  location?: string;

  @ApiProperty({ example: '안건 정리', required: false })
  memo?: string;

  @ApiProperty({ example: '타입', required: false })
  sourceType?: string;

  @ApiProperty({ example: '타입', required: false })
  linkedIssueId?: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  createdById?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;
}
