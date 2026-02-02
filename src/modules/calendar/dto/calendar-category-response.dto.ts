// src/modules/calendar/dto/calendar-category-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class CalendarCategoryResponseDto {
  @ApiProperty({ example: 'calendar-uuid' })
  id: string;

  @ApiProperty({ example: '회의' })
  name: string;

  @ApiProperty({ example: '#3788d8' })
  categoryColor: string;

  @ApiProperty({ example: 'calendar-uuid', required: false })
  calendarId?: string;

  @ApiProperty({ example: false, required: false })
  isDefault?: boolean;
}
