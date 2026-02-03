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
    calendarId: calendarEvent.calendar?.id ?? calendarEvent.category?.calendar?.id,
    category: {
      id: calendarEvent.category.id,
      name: calendarEvent.category.name,
      categoryColor: calendarEvent.category.color,
      calendarId: calendarEvent.category.calendar?.id ?? calendarEvent.calendar?.id,
    },
    sourceType: calendarEvent.sourceType,
    linkedIssueId: calendarEvent.linkedIssueId,
    createdById: calendarEvent.createdBy?.id,
    createdBy: calendarEvent.createdBy
      ? {
          id: calendarEvent.createdBy.id,
          name: calendarEvent.createdBy.name,
          avatarUrl: calendarEvent.createdBy.avatarUrl ?? null,
        }
      : undefined,
  };
}

export function mapCategory(category: CalendarCategory) {
  return {
    id: category.id,
    name: category.name,
    categoryColor: category.color,
    calendarId: category.calendar?.id,
    isDefault: category.isDefault,
  };
}

export function mapFolder(folder: { id: string; name: string; createdBy?: { id: string } | null; isActive?: boolean }) {
  return {
    id: folder.id,
    name: folder.name,
    createdById: folder.createdBy?.id ?? null,
    isActive: folder.isActive ?? true,
  };
}
