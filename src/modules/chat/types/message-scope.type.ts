// src/modules/chat/types/message-scope.type.ts
export type MessageScope = 'CHANNEL' | 'DM';

export interface ScopedMessage<T> {
  scope: MessageScope;
  message: T;
}