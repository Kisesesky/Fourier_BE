import { ApiProperty } from '@nestjs/swagger';
import { CalendarType } from '../constants/calendar-type.enum';

export class CalendarResponseDto {
  @ApiProperty({ example: 'calendar-uuid' })
  id: string;

  @ApiProperty({ example: '팀 캘린더' })
  name: string;

  @ApiProperty({ enum: CalendarType })
  type: CalendarType;

  @ApiProperty({ example: '#3b82f6' })
  color: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  ownerId?: string | null;

  @ApiProperty({ example: 'folder-uuid', required: false })
  folderId?: string | null;
}
