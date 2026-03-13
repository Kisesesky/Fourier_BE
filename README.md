# Fourier BE

NestJS 기반의 협업/프로젝트 플랫폼 백엔드입니다. 사용자 인증, 워크스페이스/팀/프로젝트/이슈/문서/캘린더, 실시간 채팅 및 SFU(미디어룸)까지 한 서버에서 제공합니다.

## 핵심 기능
- 사용자/인증: JWT 기반 로그인, 리프레시 토큰(Redis 저장) + HttpOnly 쿠키
- 워크스페이스/팀/프로젝트/이슈 관리
- 문서, 캘린더, 알림, 멘션, 활동 로그
- 파일 업로드(GCS 연동)
- 실시간 채팅(Socket.IO) + SFU(mediasoup)
- Swagger API 문서 제공

## 기술 스택
- NestJS, TypeORM, PostgreSQL
- Redis (세션/토큰, Socket.IO 어댑터)
- Socket.IO, mediasoup
- Google Cloud Storage, Secret Manager
- Joi 환경변수 검증, Swagger

## 모듈 구성
`src/app.module.ts` 기준으로 실제 구동 모듈은 다음과 같습니다.
- Auth, Users, Members
- Workspace, Team, Projects, Issues
- Docs, Calendar
- Chat (DM/채널 + SFU 이벤트)
- Files, GCS
- Notification, Mention, ActivityLog, Support
- Verification

## 실행 방법
1. 의존성 설치
```bash
npm install
```

2. 환경변수 준비
- 개발: `.env/development.env`
- 배포: `.env/production.env`

3. 개발 실행
```bash
npm run start:dev
```

4. 프로덕션 실행
```bash
npm run build
npm run start:prod
```

## 환경변수
환경변수는 Joi 스키마로 강제되며 누락 시 부팅이 실패합니다.

### App
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `PORT`
- `FRONTEND_URL`
- `GMAIL_USER`
- `GMAIL_PASS`
- `SWAGGER_USER`
- `SWAGGER_PASSWORD`
- `NODE_ENV` (`development` | `production`)
- `DEFAULT_AVATAR`
- `SFU_ROOM_SNAPSHOT_TTL`
- `SFU_ANNOUNCED_IP` (optional)

### DB
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

### Redis
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_TTL`
- `REDIS_MAX`

### GCS
- `GCS_STORAGE_KEYFILE`
- `GCS_SECRET_NAME`
- `GCS_STORAGE_BUCKET`
- `GCS_STORAGE_PROJECT_ID`

### Social Login
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_CALLBACK_URL`
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `NAVER_CALLBACK_URL`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`

## 마이그레이션
서버 부팅 시 `migrations` 테이블이 없으면 1회 자동 실행됩니다.
- 코드: `src/database/run-migrations.ts`

수동 실행 스크립트:
```bash
npm run migration:generate
npm run migration:run
npm run migration:revert
```

## API 문서 (Swagger)
- URL: `/docs`
- 개발 환경(`NODE_ENV=development`)에서는 공개
- 운영 환경에서는 Basic Auth 적용 (`SWAGGER_USER`, `SWAGGER_PASSWORD`)

## API Prefix / Health
- 기본 prefix: `/api/v1`
- 헬스체크: `/health` (prefix 제외)

## 실시간 통신
- Socket.IO namespace: `/chat`
- Redis 어댑터를 통한 멀티 인스턴스 메시지 브로드캐스팅
- SFU 관련 이벤트는 `ChatGateway`에서 처리

## 디렉터리 개요
- `src/modules/*` 기능 모듈
- `src/config/*` 환경변수/설정
- `src/database/*` TypeORM 설정 및 마이그레이션
- `static/` 정적 리소스
- `dist/` 빌드 결과물

## Deployment
본 서비스는 Docker 기반 컨테이너 환경에서 운영됩니다.
```
Internet
   │
   ▼
Nginx (Reverse Proxy / HTTPS)
   │
   ▼
NestJS API Server (Docker)
   │
   ▼
PostgreSQL Database (Docker)
```

## CI/CD Pipeline
GitHub Actions를 활용하여 Docker 이미지 빌드 및 배포 파이프라인을 구축했습니다.
```workflow
GitHub Push (main)
      │
      ▼
GitHub Actions
      │
      ▼
Docker Image Build
      │
      ▼
Docker Hub Push
      │
      ▼
Server Deployment
```

## Docker 실행
서버에서 다음 명령으로 실핼할 수 있습니다.
```bash
docker compose up -d
```
컨테이너 상태 확인
```bash
docker ps
```
로그확인
```bash
docker logs fourier_app
```

## 참고
- 로컬에서 실행 시 PostgreSQL/Redis가 필요합니다.
- CORS 도메인은 `FRONTEND_URL`로 제어됩니다.
