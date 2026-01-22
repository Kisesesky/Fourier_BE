// src/modules/mention/utils/mention-parser.util.ts
import { MentionTargetType } from '../constants/mention-target-type.enum';

export type ParsedMention = {
  type: MentionTargetType;
  id: string | null;
  label: string;
};

const MENTION_REGEX =
  /<@(user|team|everyone):([a-z0-9-]+)?\|([^>]+)>/gi;

export function parseMentions(text: string): ParsedMention[] {
  const result: ParsedMention[] = [];
  let match;

  while ((match = MENTION_REGEX.exec(text))) {
    const rawType = match[1].toUpperCase();

    result.push({
      type: rawType === 'EVERYONE'
        ? MentionTargetType.EVERYONE
        : rawType === 'TEAM'
        ? MentionTargetType.TEAM
        : MentionTargetType.USER,
      id: match[2] ?? null,
      label: match[3],
    });
  }

  return result;
}