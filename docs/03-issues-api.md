# Issues API

참고 위치
- 타입: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/types.ts`
- 클라이언트: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/issues/_service/api.ts`

엔드포인트
- `GET /projects/:projectId/issues`
- `GET /issues/:id`
- `GET /issues/:id/comments`
- `POST /issues/:id/comments`
- `GET /issues/:id/activities?type=...`
- `GET /users/search?q=...&limit=...`

요청 파라미터

Path
| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| projectId | string | O | 프로젝트 ID |
| id | string | O | 이슈 ID |

Query
| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| type | string | X | activity 필터 (status/assignee/comment/system) |
| q | string | X | 사용자 검색 키워드 |
| limit | number | X | 사용자 검색 최대 개수 |

Body
| 엔드포인트 | 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| POST /issues/:id/comments | body | string | O | 댓글 본문 |

응답 필드

Issue
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 이슈 ID |
| key | string | O | 이슈 키 |
| title | string | O | 제목 |
| description | string | X | 설명 |
| status | string | O | 상태 |
| priority | string | O | 우선순위 |
| assigneeId | string | X | 담당자 ID |
| assignee | object | X | 담당자 객체(이름 포함) |
| reporterId | string | X | 보고자 ID |
| reporter | object | X | 보고자 객체(이름 포함) |
| createdAt | string | O | ISO 시간 |
| updatedAt | string | O | ISO 시간 |

IssueComment
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 댓글 ID |
| issueId | string | O | 이슈 ID |
| authorId | string | X | 작성자 ID |
| author | object | X | 작성자 객체(이름 포함) |
| body | string | O | 댓글 본문 |
| createdAt | string | O | ISO 시간 |

IssueActivity
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 활동 ID |
| issueId | string | O | 이슈 ID |
| type | string | O | 활동 타입 |
| text | string | O | 활동 설명 |
| createdAt | string | O | ISO 시간 |

User
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 사용자 ID |
| name | string | O | 이름 |
| email | string | O | 이메일 |
| avatarUrl | string | X | 아바타 URL |

주의사항
- `assignee`/`reporter`는 중첩 객체 또는 `assigneeId`/`reporterId`로 제공 가능
- `createdAt`/`updatedAt`은 ISO 문자열

예시 응답

Issue
```json
{
  "id": "issue-1",
  "key": "PROJ-101",
  "title": "Fix header layout",
  "description": "Short description",
  "status": "in_progress",
  "priority": "high",
  "assigneeId": "user-1",
  "assignee": { "id": "user-1", "name": "Alice" },
  "reporterId": "user-2",
  "reporter": { "id": "user-2", "name": "Bob" },
  "createdAt": "2025-10-01T12:00:00Z",
  "updatedAt": "2025-10-02T10:00:00Z"
}
```

IssueComment
```json
{
  "id": "comment-1",
  "issueId": "issue-1",
  "authorId": "user-1",
  "author": { "id": "user-1", "name": "Alice" },
  "body": "Looks good",
  "createdAt": "2025-10-02T10:00:00Z"
}
```

IssueActivity
```json
{
  "id": "activity-1",
  "issueId": "issue-1",
  "type": "status",
  "text": "Status changed to in_progress",
  "createdAt": "2025-10-02T10:00:00Z"
}
```

User
```json
{
  "id": "user-1",
  "name": "Alice",
  "email": "alice@example.com",
  "avatarUrl": "https://example.com/avatar.png"
}
```

요청/응답 추가 예시

GET /projects/:projectId/issues
```http
GET /projects/proj-1/issues
```
```json
[
  {
    "id": "issue-1",
    "key": "PROJ-101",
    "title": "Fix header layout",
    "status": "in_progress",
    "priority": "high",
    "createdAt": "2025-10-01T12:00:00Z",
    "updatedAt": "2025-10-02T10:00:00Z"
  }
]
```

GET /issues/:id
```http
GET /issues/issue-1
```

GET /issues/:id/comments
```http
GET /issues/issue-1/comments
```

POST /issues/:id/comments
```http
POST /issues/issue-1/comments
Content-Type: application/json
```
```json
{ "body": "Looks good" }
```

GET /issues/:id/activities
```http
GET /issues/issue-1/activities?type=status
```

GET /users/search
```http
GET /users/search?q=alice&limit=8
```

열거형
- IssueStatus: `backlog | todo | in_progress | review | done`
- Priority: `low | medium | high | urgent`
- ActivityType: `status | assignee | comment | system`
