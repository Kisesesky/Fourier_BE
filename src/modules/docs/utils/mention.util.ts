// src/modules/docs/utils/mention.util.ts
export function extractMentions(content: string): string[] {
  const regex = /@([a-zA-Z0-9_]+)/g;
  const result = new Set<string>();

  let match;
  while ((match = regex.exec(content)) !== null) {
    result.add(match[1]);
  }

  return [...result];
}