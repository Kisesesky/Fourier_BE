# Docs API (제안)

참고 위치
- 타입: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/types.ts`
- Mock: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/docs/lib/mocks/mocks.ts`

핵심 엔티티
- DocMeta, DocFolder, DocVersion
- `content`는 TipTap JSONContent

제안 엔드포인트
- `GET /projects/:projectId/docs/folders`
- `GET /projects/:projectId/docs`
- `GET /docs/:docId`
- `POST /docs`
- `PATCH /docs/:docId`
- `DELETE /docs/:docId`
- `GET /docs/:docId/versions`
- `POST /docs/:docId/versions`
- `GET /docs/:docId/comments`

요청 파라미터

Path
| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| projectId | string | O | 프로젝트 ID |
| docId | string | O | 문서 ID |

Body (예)
| 엔드포인트 | 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| POST /docs | title | string | O | 문서 제목 |
| POST /docs | content | object | X | TipTap JSONContent |
| PATCH /docs/:docId | title | string | X | 문서 제목 |
| PATCH /docs/:docId | content | object | X | TipTap JSONContent |

응답 필드

DocMeta
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 문서 ID |
| title | string | O | 제목 |
| description | string | X | 설명 |
| icon | string | X | 아이콘 키 |
| color | string | X | 색상 |
| folderId | string | O | 폴더 ID |
| locations | array | O | 위치 목록 |
| owner | string | O | 소유자 이름 |
| fileSize | number | X | 파일 크기 |
| starred | boolean | X | 즐겨찾기 |
| content | object | X | TipTap JSONContent |
| createdAt | string | O | ISO 시간 |
| updatedAt | string | O | ISO 시간 |
| versions | array | X | 버전 목록 |

DocFolder
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | O | 폴더 ID |
| name | string | O | 폴더 이름 |
| icon | string | X | 아이콘 키 |
| color | string | X | 색상 |
| parentId | string | X | 상위 폴더 ID |
| createdAt | string | O | ISO 시간 |
| updatedAt | string | O | ISO 시간 |

예시 응답

DocMeta
```json
{
  "id": "doc-1",
  "title": "Project Spec",
  "description": "Spec detail",
  "icon": "book",
  "color": "#2563eb",
  "folderId": "root-planning",
  "locations": ["root-planning"],
  "owner": "Team",
  "fileSize": 140,
  "starred": true,
  "content": { "type": "doc", "content": [] },
  "createdAt": "2025-10-01T12:00:00Z",
  "updatedAt": "2025-10-02T10:00:00Z",
  "versions": [
    { "id": "v1", "date": "2025-10-01T12:00:00Z", "content": { "type": "doc", "content": [] } }
  ]
}
```

DocFolder
```json
{
  "id": "root-planning",
  "name": "Planning",
  "icon": "note",
  "color": "#fbbf24",
  "parentId": null,
  "createdAt": "2025-10-01T12:00:00Z",
  "updatedAt": "2025-10-02T10:00:00Z"
}
```

요청/응답 추가 예시

GET /projects/:projectId/docs
```http
GET /projects/proj-1/docs
```
```json
[
  {
    "id": "doc-1",
    "title": "Project Spec",
    "folderId": "root-planning",
    "createdAt": "2025-10-01T12:00:00Z",
    "updatedAt": "2025-10-02T10:00:00Z"
  }
]
```

GET /projects/:projectId/docs/folders
```http
GET /projects/proj-1/docs/folders
```
```json
[
  { "id": "root-planning", "name": "Planning", "parentId": null }
]
```

POST /docs
```http
POST /docs
Content-Type: application/json
```
```json
{
  "title": "New Doc",
  "content": { "type": "doc", "content": [] }
}
```
