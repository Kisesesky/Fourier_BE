// src/modules/issues/utils/sync-calendar-event.ts
import { Issue } from "../entities/issue.entity";
import { CalendarService } from "../../calendar/calendar.service";

export async function syncCalendarEvent(issue: Issue, calendarService: CalendarService) {
  if (!issue.startAt || !issue.endAt) {
    // 일정 정보 없으면 이벤트 삭제
    await calendarService.deleteEventByIssue(issue);
    return;
  }

  if (!issue.calendarEventId) {
    // 새 이벤트 생성
    const event = await calendarService.createEventFromIssue(issue);
    issue.calendarEventId = event.id;
  } else {
    // 기존 이벤트 업데이트
    await calendarService.updateEventFromIssue(issue);
  }
}