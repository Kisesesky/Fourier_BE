# 개요

목적
- 이 문서는 `Fourier_FE`의 실제 사용 방식에 맞춘 백엔드 API 계약을 정의합니다.
- 프론트에서 실제로 호출하는 엔드포인트를 우선 기준으로 삼습니다.

현재 프론트 호출 경로
- Issues: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/issues/_service/api.ts`
- Chat: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/chat/_service/api.ts`
- Calendar: `Fourier_FE/app/(workspace)/workspace/[teamId]/[projectId]/calendar/_service/api.ts`

Mock 기반 도메인 (타입만 존재)
- Docs, Members, Worksheet

문서 버전
- v0.1 (초기 계약)
