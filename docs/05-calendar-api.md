# Calendar API

참고 위치
- 타입: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/calendar/_model/types.ts`
- 클라이언트: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/calendar/_service/api.ts`

엔드포인트
- `GET /projects/:projectId/calendar/events?start=...&end=...`

요청 파라미터

Path
| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| projectId | string | O | 프로젝트 ID |

Query
| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| start | string | X | ISO 시작 시각 |
| end | string | X | ISO 종료 시각 |

응답 필드

CalendarEvent
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 이벤트 ID |
| calendarId | string | O | 캘린더 ID |
| title | string | O | 제목 |
| start | string | O | ISO 시작 시각 |
| end | string | X | ISO 종료 시각 |
| allDay | boolean | O | 종일 여부 |
| location | string | X | 위치 |
| description | string | X | 설명 |

예시 응답
```json
{
  "id": "event-1",
  "calendarId": "team",
  "title": "Sprint Review",
  "start": "2025-10-05T14:00:00Z",
  "end": "2025-10-05T15:00:00Z",
  "allDay": false,
  "location": "Room C",
  "description": "Weekly review"
}
```

요청/응답 추가 예시

GET /projects/:projectId/calendar/events
```http
GET /projects/proj-1/calendar/events?start=2025-10-01T00:00:00Z&end=2025-10-31T23:59:59Z
```
```json
[
  {
    "id": "event-1",
    "calendarId": "team",
    "title": "Sprint Review",
    "start": "2025-10-05T14:00:00Z",
    "end": "2025-10-05T15:00:00Z",
    "allDay": false
  }
]
```

주의사항
- 응답은 `CalendarEvent` 배열
