## Config & Migration 설계

이 프로젝트는 실제 배포 환경을 가정하여,
설정 및 마이그레이션에서 발생할 수 있는 실수를 줄이는 것을 목표로 했습니다.

- ConfigModule.forRoot는 애플리케이션 초기화 단계에서 한 번만 실행되도록 단일화했습니다.
  (설정이 여러 번 초기화되는 문제를 방지하기 위함입니다.)

- 필수 환경변수는 getOrThrow를 사용하여,
  설정 누락 시 서버가 즉시 실패하도록 설계했습니다.

- Migration은 서버 최초 실행 시 1회만 자동 실행되며,
  이후 스키마 변경은 명시적으로 migration을 실행하도록 했습니다.
  이는 운영 환경에서 의도치 않은 스키마 변경을 방지하기 위함입니다.

※ 학습 과정에서 배포 및 운영 관점의 안정성을 고려해 설계했습니다.


## AUTH POLICY (Web App Unified)

본 프로젝트는 웹을 단일 클라이언트로 간주하며,
앱은 웹을 감싼 WebApp 형태로 제공된다.
따라서 인증 정책은 웹/앱을 분리하지 않는다.

1. Client
  - Web / App(WebView): Browser Runtime

2. Access Token
  - JWT
  - HttpOnly Cookie

3. Refresh Token
  - JWT
  - HttpOnly Cookie
  - 서버(Redis)에 해시 저장

4. Session Policy
  - 사용자당 단일 세션
  - 새 로그인 시 기존 세션 즉시 무효화

5. Refresh Token Rotation
  - 미사용 (단일 세션 정책)

6. Logout
  - 서버: Refresh Token 삭제
  - 클라이언트: Access / Refresh Cookie 만료

7. Origin
  - Web(App 포함) 공통 개념
  - whitelist 기반 검증