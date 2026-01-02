# NestJS 설계 가이드

구성 원칙
- 도메인별 모듈 분리 (issues, chat, calendar, docs, members, worksheet)
- 컨트롤러는 라우팅, 서비스는 비즈니스 로직, DTO는 검증 전용
- 응답 타입은 FE 타입과 1:1로 매칭

권장 폴더 구조 (예)
```
src/
  modules/
    issues/
      issues.controller.ts
      issues.service.ts
      dto/
        create-comment.dto.ts
        search-users.dto.ts
        list-issues.dto.ts
    chat/
    calendar/
    docs/
    members/
    worksheet/
```

컨트롤러 매핑 (요약)
- IssuesController
  - GET /projects/:projectId/issues
  - GET /issues/:id
  - GET /issues/:id/comments
  - POST /issues/:id/comments
  - GET /issues/:id/activities
  - GET /users/search
- ChatController
  - GET /projects/:projectId/channels
  - GET /channels/:channelId/messages
- CalendarController
  - GET /projects/:projectId/calendar/events
- DocsController (제안)
  - GET /projects/:projectId/docs
  - GET /projects/:projectId/docs/folders
  - GET /docs/:docId
  - POST /docs
  - PATCH /docs/:docId
  - DELETE /docs/:docId
- MembersController (제안)
  - GET /teams/:teamId/members
  - GET /teams/:teamId/invites
  - GET /teams/:teamId/presence
  - GET /teams/:teamId/summary
- WorksheetController (제안)
  - GET /projects/:projectId/worksheets
  - GET /worksheets/:worksheetId
  - PATCH /worksheets/:worksheetId

DTO 샘플 코드

CreateIssueCommentDto (`src/modules/issues/dto/create-comment.dto.ts`)
```ts
import { IsString, MinLength } from "class-validator";

export class CreateIssueCommentDto {
  @IsString()
  @MinLength(1)
  body!: string;
}
```

SearchUsersQueryDto (`src/modules/issues/dto/search-users.dto.ts`)
```ts
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { Transform } from "class-transformer";

export class SearchUsersQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit?: number;
}
```

CalendarRangeQueryDto (`src/modules/calendar/dto/calendar-range.dto.ts`)
```ts
import { IsISO8601, IsOptional } from "class-validator";

export class CalendarRangeQueryDto {
  @IsOptional()
  @IsISO8601()
  start?: string;

  @IsOptional()
  @IsISO8601()
  end?: string;
}
```

UpdateWorksheetDto (`src/modules/worksheet/dto/update-worksheet.dto.ts`)
```ts
import { IsArray, IsOptional, IsString } from "class-validator";

export class UpdateWorksheetDto {
  @IsOptional()
  @IsArray()
  columns?: unknown[];

  @IsOptional()
  @IsArray()
  rows?: unknown[];

  @IsOptional()
  @IsString()
  status?: string;
}
```

컨트롤러 샘플

IssuesController (`src/modules/issues/issues.controller.ts`)
```ts
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreateIssueCommentDto } from "./dto/create-comment.dto";
import { SearchUsersQueryDto } from "./dto/search-users.dto";
import { IssuesService } from "./issues.service";

@Controller()
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get("projects/:projectId/issues")
  listIssues(@Param("projectId") projectId: string) {
    return this.issuesService.listIssues(projectId);
  }

  @Get("issues/:id")
  getIssue(@Param("id") id: string) {
    return this.issuesService.getIssue(id);
  }

  @Get("issues/:id/comments")
  listComments(@Param("id") id: string) {
    return this.issuesService.listComments(id);
  }

  @Post("issues/:id/comments")
  addComment(@Param("id") id: string, @Body() dto: CreateIssueCommentDto) {
    return this.issuesService.addComment(id, dto);
  }

  @Get("users/search")
  searchUsers(@Query() query: SearchUsersQueryDto) {
    return this.issuesService.searchUsers(query);
  }
}
```

검증 가이드
- class-validator 사용
- 문자열/숫자/enum 검증을 명시
- `limit` 등은 기본값 보정 로직 포함

응답 가이드
- FE가 기대하는 JSON 키를 그대로 유지
- 날짜 포맷: Issues/Chat/Calendar/Docs는 ISO 문자열
- 숫자 시간: Members/Worksheet는 ms
