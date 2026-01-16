import { ApiProperty } from "@nestjs/swagger";

// src/modules/calendar/dto/create-calendar-event-from-issue.dto.ts
export class CreateCalendarEventFromIssueDto {
  @ApiProperty({ example: 'issue-uuid' })
  issueId: string;

  @ApiProperty({ example: '제목' })
  title: string;

  @ApiProperty({ example: '기간' })
  dueAt: Date;

  @ApiProperty({ example: 'project-uuid' })
  projectId: string;
}