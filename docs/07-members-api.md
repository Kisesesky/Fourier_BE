# Members API (제안)

참고 위치
- 타입: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/members/_model/types.ts`
- Mock: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/members/_model/mocks.ts`

제안 엔드포인트
- `GET /teams/:teamId/members`
- `GET /teams/:teamId/invites`
- `GET /teams/:teamId/presence`
- `GET /teams/:teamId/summary`

요청 파라미터

Path
| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| teamId | string | O | 팀 ID |

응답 필드

Member
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 멤버 ID |
| name | string | O | 이름 |
| email | string | O | 이메일 |
| role | string | O | 역할 |
| title | string | X | 직함 |
| avatarUrl | string | X | 아바타 URL |
| location | string | X | 위치 |
| timezone | string | X | 타임존 |
| description | string | X | 소개 |
| joinedAt | number | O | 가입 시간(ms) |
| lastActiveAt | number | O | 마지막 활동(ms) |
| isFavorite | boolean | X | 즐겨찾기 여부 |
| statusMessage | string | X | 상태 메시지 |
| tags | array | X | 태그 |

MemberInvite
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 초대 ID |
| email | string | O | 이메일 |
| role | string | O | 역할 |
| invitedBy | string | O | 초대한 사람 ID |
| invitedByName | string | O | 초대한 사람 이름 |
| invitedAt | number | O | 초대 시간(ms) |
| status | string | O | 상태 |
| message | string | X | 메시지 |
| name | string | X | 이름 |
| avatarUrl | string | X | 아바타 URL |

MemberPresence
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| memberId | string | O | 멤버 ID |
| status | string | O | 온라인 상태 |
| lastSeenAt | number | O | 마지막 접속(ms) |

MemberSummary
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| total | number | O | 총 인원 |
| online | number | O | 온라인 인원 |
| favorites | number | O | 즐겨찾기 수 |

예시 응답

Member
```json
{
  "id": "mem-1",
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin",
  "title": "Design Lead",
  "avatarUrl": "https://example.com/avatar.png",
  "joinedAt": 1730457600000,
  "lastActiveAt": 1730458600000,
  "isFavorite": true,
  "statusMessage": "Reviewing"
}
```

MemberInvite
```json
{
  "id": "inv-1",
  "email": "new@example.com",
  "role": "member",
  "invitedBy": "mem-1",
  "invitedByName": "Alice",
  "invitedAt": 1730457600000,
  "status": "pending"
}
```

MemberPresence
```json
{
  "memberId": "mem-1",
  "status": "online",
  "lastSeenAt": 1730458600000
}
```

MemberSummary
```json
{
  "total": 10,
  "online": 4,
  "favorites": 2
}
```

요청/응답 추가 예시

GET /teams/:teamId/members
```http
GET /teams/team-1/members
```
```json
[
  { "id": "mem-1", "name": "Alice", "email": "alice@example.com", "role": "admin" }
]
```

GET /teams/:teamId/presence
```http
GET /teams/team-1/presence
```
```json
[
  { "memberId": "mem-1", "status": "online", "lastSeenAt": 1730458600000 }
]
```

주의사항
- 이 도메인의 시간 필드는 모두 number(ms) 기준
