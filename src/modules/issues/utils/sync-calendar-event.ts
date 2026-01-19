// src/modules/issues/utils/sync-calendar-event.ts
import { Issue } from "src/modules/issues/entities/issue.entity";
import { CalendarService } from "../../calendar/calendar.service";
import { Repository } from "typeorm";

export async function syncCalendarEvent(
  issue: Issue,
  calendarService: CalendarService,
  issueRepository: Repository<Issue>,
) {
  if (!issue.startAt || !issue.endAt) {
    if (issue.calendarEventId) {
    // 일정 정보 없으면 이벤트 삭제
      await calendarService.deleteEventByIssue(issue);
      issue.calendarEventId = null;
      await issueRepository.save(issue);
    }
    return;
  }

  if (!issue.calendarEventId) {
    // 새 이벤트 생성
    const event = await calendarService.createEventFromIssue(issue);
    issue.calendarEventId = event.id;
    await issueRepository.save(issue);
  } else {
    // 기존 이벤트 업데이트
    await calendarService.updateEventFromIssue(issue);
  }
}