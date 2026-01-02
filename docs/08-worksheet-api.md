# Worksheet API (제안)

참고 위치
- 타입: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/worksheet/_model/types.ts`
- Mock: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/worksheet/_model/mocks.ts`

제안 엔드포인트
- `GET /projects/:projectId/worksheets` (메타 목록)
- `GET /worksheets/:worksheetId` (상세)
- `PATCH /worksheets/:worksheetId` (컬럼/로우 업데이트)

요청 파라미터

Path
| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| projectId | string | O | 프로젝트 ID |
| worksheetId | string | O | 워크시트 ID |

Body (예)
| 엔드포인트 | 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| PATCH /worksheets/:worksheetId | columns | array | X | 컬럼 목록 |
| PATCH /worksheets/:worksheetId | rows | array | X | 로우 목록 |
| PATCH /worksheets/:worksheetId | status | string | X | 상태 |

응답 필드

WorksheetMeta
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 워크시트 ID |
| title | string | O | 제목 |
| ownerName | string | O | 소유자 |
| updatedAt | number | O | 갱신 시간(ms) |
| status | string | O | 상태 |

Worksheet
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 워크시트 ID |
| title | string | O | 제목 |
| ownerName | string | O | 소유자 |
| updatedAt | number | O | 갱신 시간(ms) |
| status | string | O | 상태 |
| columns | array | O | 컬럼 목록 |
| rows | array | O | 로우 목록 |
| tags | array | X | 태그 |
| description | string | X | 설명 |

예시 응답

WorksheetMeta
```json
{
  "id": "ws-001",
  "title": "Launch Checklist",
  "ownerName": "Alice",
  "updatedAt": 1730457600000,
  "status": "in-review"
}
```

Worksheet
```json
{
  "id": "ws-001",
  "title": "Launch Checklist",
  "ownerName": "Alice",
  "updatedAt": 1730457600000,
  "status": "in-review",
  "columns": [
    { "id": "col-title", "title": "Task", "type": "text" }
  ],
  "rows": [
    {
      "id": "row-1",
      "updatedAt": 1730457600000,
      "cells": [{ "columnId": "col-title", "value": "QA sign-off" }]
    }
  ],
  "tags": ["launch"],
  "description": "Tasks before release"
}
```

요청/응답 추가 예시

GET /projects/:projectId/worksheets
```http
GET /projects/proj-1/worksheets
```
```json
[
  { "id": "ws-001", "title": "Launch Checklist", "ownerName": "Alice", "updatedAt": 1730457600000, "status": "in-review" }
]
```

PATCH /worksheets/:worksheetId
```http
PATCH /worksheets/ws-001
Content-Type: application/json
```
```json
{
  "status": "done"
}
```

주의사항
- `updatedAt` 필드는 number(ms) 기준
