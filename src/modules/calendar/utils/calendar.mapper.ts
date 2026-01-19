// src/modules/calendar/utils/calendar.mapper.ts
import { CalendarEventResponseDto } from "../dto/calendar-event-response.dto";
import { CalendarCategory } from "../entities/calendar-category.entity";
import { CalendarEvent } from "../entities/calendar-event.entity";

export function mapEventToResponse(
  calendarEvent: CalendarEvent
): CalendarEventResponseDto {
  return {
    id: calendarEvent.id,
    title: calendarEvent.title,
    startAt: calendarEvent.startAt,
    endAt: calendarEvent.endAt,
    location: calendarEvent.location,
    memo: calendarEvent.memo,
    createdAt: calendarEvent.createdAt,
    category: {
      id: calendarEvent.category.id,
      name: calendarEvent.category.name,
      categoryColor: calendarEvent.category.color,
    },
    sourceType: calendarEvent.sourceType,
    linkedIssueId: calendarEvent.linkedIssueId,
    createdById: calendarEvent.createdBy?.id,
  };
}

export function mapCategory(category: CalendarCategory) {
  return {
    id: category.id,
    name: category.name,
    categoryColor: category.color,
  };
}