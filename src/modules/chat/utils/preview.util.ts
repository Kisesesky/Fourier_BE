// src/modules/chat/utils/preview.util.ts
export function makePreview(text: string, length = 200) {
  return text.length > length
    ? text.slice(0, length) + '...'
    : text;
}