// src/modules/mention/dto/mention-item.dto.ts
import { MentionTargetType } from "../constants/mention-target-type.enum";

export class MentionItemDto {
  id: string;

  actor: {
    id: string;
    name: string;
  };

  type: MentionTargetType;

  projectId?: string;

  issueId?: string;
  commentId?: string;

  message: string;
  isRead: boolean;
  createdAt: Date;
}