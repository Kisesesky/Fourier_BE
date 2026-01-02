# Chat API

참고 위치
- 타입: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/types.ts`
- 클라이언트: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/chat/_service/api.ts`

엔드포인트
- `GET /projects/:projectId/channels`
- `GET /channels/:channelId/messages`

요청 파라미터

Path
| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| projectId | string | O | 프로젝트 ID |
| channelId | string | O | 채널 ID |

응답 필드

Channel
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 채널 ID |
| name | string | O | 채널 이름 |
| workspaceId | string | O | 워크스페이스/팀 ID |
| isDm | boolean | X | DM 여부 |

Msg
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 메시지 ID |
| authorId | string | O | 작성자 ID |
| author | object | X | 작성자 객체(이름 포함) |
| text | string | O | 본문 |
| createdAt | string | O | ISO 시간 |
| channelId | string | O | 채널 ID |
| attachments | array | X | 첨부 파일 |
| reactions | object | X | 리액션 맵 |
| mentions | array | X | 멘션 ID 목록 |
| seenBy | array | X | 읽은 사용자 ID 목록 |
| threadCount | number | X | 스레드 수 |

주의사항
- 프론트는 `teamId` 또는 `workspaceId`를 `workspaceId`로 매핑합니다.

예시 응답

Channel
```json
{
  "id": "general",
  "name": "# general",
  "workspaceId": "team-1",
  "isDm": false
}
```

Msg
```json
{
  "id": "msg-1",
  "authorId": "user-1",
  "author": { "id": "user-1", "name": "Alice" },
  "text": "Hello",
  "createdAt": "2025-10-02T10:00:00Z",
  "channelId": "general"
}
```

요청/응답 추가 예시

GET /projects/:projectId/channels
```http
GET /projects/proj-1/channels
```
```json
[
  { "id": "general", "name": "# general", "workspaceId": "team-1" },
  { "id": "random", "name": "# random", "workspaceId": "team-1" }
]
```

GET /channels/:channelId/messages
```http
GET /channels/general/messages
```
```json
[
  {
    "id": "msg-1",
    "authorId": "user-1",
    "author": { "id": "user-1", "name": "Alice" },
    "text": "Hello",
    "createdAt": "2025-10-02T10:00:00Z",
    "channelId": "general"
  }
]
```
