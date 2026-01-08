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

# 프로젝트 아키텍처 및 채팅/채널 모듈 구조

## 1. 모듈 구조
AppModule
├─ UsersModule
├─ MembersModule
├─ AuthModule
├─ WorkspaceModule
│    ├─ WorkspaceService
│    ├─ WorkspaceChannelFacade
│    └─ ChannelModule (forwardRef)
├─ ChannelModule
│    ├─ ChannelService
│    ├─ ChannelController
│    └─ ChatModule (forwardRef)
└─ ChatModule
├─ ChatService
├─ ChannelChatService
├─ ChatController
├─ Gateways
│    ├─ ChatGateway
│    ├─ MessageGateway
│    └─ ChannelGateway
└─ ChannelModule (forwardRef)
- **WorkspaceModule**: 워크스페이스 관련 기능 + WorkspaceChannelFacade  
- **ChannelModule**: 채널 생성/조회/멤버 관리 + ChannelService  
- **ChatModule**: DM, 채널 메시지 처리 + ChatService, ChannelChatService  
- **Gateways**: WebSocket 기반 실시간 채팅/채널 이벤트 처리

---

## 2. 순환 의존성(Circular Dependency) 해결

NestJS에서는 모듈 간 서로 필요한 서비스를 참조할 때 순환 참조 문제가 발생할 수 있습니다.  
해결 방법:

- `forwardRef(() => ModuleName)` 사용
- 예시:
```ts
@Module({
  imports: [forwardRef(() => ChatModule)],
  providers: [ChannelService],
  exports: [ChannelService],
})
export class ChannelModule {}
```
•	ChatModule에서도 ChannelModule을 필요로 하는 경우 forwardRef로 순환 고리를 끊습니다.

## 3. WebSocket Gateway 구조

- ChannelGateway
	•	/channel namespace
	•	채널 입장, 메시지 전송, 읽음 처리, 메시지 삭제
	•	채널 뮤트 상태 확인
	•	클라이언트 JWT 인증

- MessageGateway
	•	/dm namespace
	•	1:1 DM 입장, 메시지 전송, 읽음 처리, typing 이벤트
	•	온라인 상태 관리 (presence-update)
	•	클라이언트 JWT 인증

## 4. 서비스 구조

- ChannelService
	•	채널 생성, 조회, 멤버 검증, 채널 뮤트
	•	워크스페이스 권한 확인
	•	public/private 채널 구분

- ChannelChatService
	•	채널 메시지 CRUD
	•	메시지 삭제 시 soft-delete / hard-delete 처리
	•	읽음 처리 및 미확인 메시지 수 계산
	•	뮤트 여부 확인

- ChatService
	•	DM 채팅방 생성/조회
	•	DM 메시지 전송/삭제
	•	읽음 처리 및 미확인 메시지 수 계산

## 5. DI 및 Repository 구조
	•	모든 TypeORM Repository는 각 모듈 TypeOrmModule.forFeature에서 등록
	•	서로 참조되는 서비스는 forwardRef() 사용
	•	WorkspaceChannelFacade에서 WorkspaceService, ChannelService, ChannelChatService를 주입하여 채널 메타 정보를 결합

## 6. 프로젝트 특징
	•	NestJS + TypeORM + WebSocket 기반 실시간 채팅
	•	DM과 워크스페이스 채널을 모두 지원
	•	메시지 soft-delete / hard-delete 로직
	•	채널 뮤트, 읽음 처리, typing 이벤트 등 실시간 상태 관리
	•	순환 의존성 forwardRef()로 안정화

## 7. DM/채팅방 시퀀스
sequenceDiagram
    participant Client as 사용자 클라이언트
    participant ChatGateway as ChatGateway (/chat)
    participant ChatService as ChatService
    participant DB as Database

    Client->>ChatGateway: WebSocket 연결 + JWT
    ChatGateway->>ChatGateway: JWT 검증
    alt 인증 실패
        ChatGateway->>Client: 연결 종료
    else 인증 성공
        ChatGateway->>Client: 연결 승인
        ChatGateway->>DB: 사용자 참여 DM room 조회
        DB-->>ChatGateway: DM room 리스트
        ChatGateway->>Client: room join
    end

    Client->>ChatGateway: join-room {roomId}
    ChatGateway->>ChatGateway: 권한 체크
    ChatGateway->>Client: join ok

    Client->>ChatGateway: send-message {roomId, content}
    ChatGateway->>ChatService: sendMessage(roomId, userId, content)
    ChatService->>DB: 메시지 저장
    DB-->>ChatService: 저장된 메시지
    ChatService-->>ChatGateway: 메시지 반환
    ChatGateway->>Client: ACK {messageId, tempId}
    ChatGateway->>ClientsInRoom: new-dm-message {messageId, content, senderId}

    Client->>ChatGateway: read-room {roomId}
    ChatGateway->>ChatService: markRoomAsRead(roomId, userId)
    ChatService->>DB: isRead 업데이트
    ChatGateway->>ClientsInRoom: dm-read-update {userId, roomId}

    Client->>ChatGateway: typing-start / typing-stop
    ChatGateway->>ClientsInRoom: typing-update {isTyping, userId}

## 8. Channel/Workspace 시퀀스
sequenceDiagram
    participant Client as 사용자 클라이언트
    participant ChannelGateway as ChannelGateway (/channel)
    participant ChannelChatService as ChannelChatService
    participant DB as Database

    Client->>ChannelGateway: WebSocket 연결 + JWT
    ChannelGateway->>ChannelGateway: JWT 검증 + userId 저장
    alt 인증 실패
        ChannelGateway->>Client: 연결 종료
    end

    Client->>ChannelGateway: join-channel {channelId}
    ChannelGateway->>ChannelChatService: verifyChannelAccess(channelId, userId)
    ChannelChatService->>DB: channel-member 존재 여부
    DB-->>ChannelChatService: 존재 여부 반환
    ChannelChatService-->>ChannelGateway: 권한 확인
    ChannelGateway->>Client: join ok
    ChannelGateway->>ChannelChatService: markChannelAsRead(channelId, userId)
    ChannelChatService->>DB: lastReadAt 업데이트

    Client->>ChannelGateway: send-channel-message {channelId, content}
    ChannelGateway->>ChannelChatService: isMuted(channelId, userId)
    ChannelChatService->>DB: 채널 mute 상태 확인
    alt muted
        ChannelGateway->>Client: CHANNEL_MUTED
    else not muted
        ChannelGateway->>ChannelChatService: sendMessage(channelId, userId, content)
        ChannelChatService->>DB: 메시지 저장
        DB-->>ChannelChatService: 저장된 메시지
        ChannelChatService-->>ChannelGateway: 메시지 반환
        ChannelGateway->>Client: ACK {messageId, tempId}
        ChannelGateway->>ClientsInChannel: new-channel-message {messageId, content, senderId}
    end

    Client->>ChannelGateway: read-channel {channelId, lastReadAt}
    ChannelGateway->>ChannelChatService: markChannelAsRead(channelId, userId, lastReadAt)
    ChannelChatService->>DB: lastReadAt 업데이트

    Client->>ChannelGateway: delete-channel-message {messageId}
    ChannelGateway->>ChannelChatService: deleteMessage(messageId, userId)
    ChannelChatService->>DB: 삭제 로직 처리 (soft/hard)
    ChannelChatService-->>ChannelGateway: 결과 반환
    ChannelGateway->>ClientsInChannel: channel-message-updated {messageId, content}