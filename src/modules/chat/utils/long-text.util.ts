// src/modules/chat/utils/long-text.util.ts
export function isLongText(content?: string) {
  return !!content && content.length > 1000;
}