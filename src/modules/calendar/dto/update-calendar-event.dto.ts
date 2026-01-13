// src/modules/calendar/dto/update-calendar-event.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCalendarEventDto } from './create-calendar-event.dto';

export class UpdateCalendarEventDto extends PartialType(
  CreateCalendarEventDto,
) {}