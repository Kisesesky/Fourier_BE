# 인증 및 기본 규칙

Base URL
- 프론트는 `NEXT_PUBLIC_API_BASE_URL`을 사용하며 기본값은 `http://localhost:3000/api`입니다.
- 아래 경로는 모두 Base URL 기준 상대 경로입니다.

Credentials
- 프론트 요청은 `credentials: "include"`를 사용합니다.
- 백엔드는 쿠키 기반 인증과 CORS credentials 허용이 필요합니다.

권장 CORS 설정 (예)
```ts
app.enableCors({
  origin: ["http://localhost:3000"],
  credentials: true,
});
```

Content-Type
- 요청/응답은 JSON 기준입니다.
- 에러 응답은 사람이 읽기 쉬운 메시지를 포함하는 것을 권장합니다.
