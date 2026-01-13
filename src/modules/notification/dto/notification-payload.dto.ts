// src/modules/notification/dto/notification-payload.dto.ts
export interface InviteNotificationPayload {
  teamId: string;
  teamName: string;
  inviterName: string;
  inviteId: string;
}