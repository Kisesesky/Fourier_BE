// src/modules/mention/utils/render-mentions.ts
export function renderMentions(text: string) {
  return text.replace(
    /<@(user|team|everyone):([a-z0-9-]+)?\|([^>]+)>/gi,
    (_, type, id, label) =>
      `<span class="mention mention-${type}" data-id="${id}">
        @${label}
      </span>`,
  );
}