// src/modules/chat/utils/extract-url.util.ts
export function extractFirstUrl(text?: string): string | null {
  if (!text) return null;

  const match = text.match(
    /(https?:\/\/[^\s]+)/i,
  );

  return match ? match[1] : null;
}